/**
 * Project janux-persistence
 * Created by ernesto on 6/9/17.
 */

import * as _ from 'lodash';
import * as logger from 'log4js';
import Promise = require("bluebird");
import {isBlankString} from "../../../util/blank-string-validator";
import {CrudRepository} from "../../api/dao/crud-repository";
import {TimeStampGenerator} from "../../util/TimeStampGenerator";
import {UuidGenerator} from "../../util/UuidGenerator";
import {AttributeFilter} from "./attribute-filter";
import {EntityPropertiesImpl} from "./entity-properties";
import {ValidationErrorImpl} from "./validation-error";

/**
 * Base class of a dao per entity.
 * This class defines the method the extended classes must implement.
 * This class defines a generic. With this I force all the extended class must defined which object type
 * is going to be used by the dao.
 * This dao has the following features and considerations.
 *
 * 1.. Encapsulate all database operations.
 *
 * 2.. Provides simple validation mechanisms.  It is not the responsibility of the dao to validate the content to
 * be inserted, updated or deleted. But the dao provides a way to tell it how to validate and when to validate.
 *
 * 3.. Provides simple db crud operations for the db engines supported.
 *
 * 4.. Provides a way to make custom implementations per db engine for cases where the dao does not provide any features,
 * like complex queries that are implemented in a different way per each db engine.
 *
 * 5.. This dao, for the moment, only works for no-sql lokijs and mongoose.
 *
 * 6.. There is only one dao for one collection in a no-sql database.
 *
 * 7.. Given that every db engine is different and the dao defines the ID generic where you can define the characteristics of the id,
 * the project has the following considerations.
 *
 *    Lokijs and mongoose assigns an unique id for every document. In lokijs the id is stored in a attribute called
 *    “$loki” of the type number.  In mongoose the id is stored in an attribute called “_id” and has a custom value type (uuid v1).
 *    As you can see. The ids provided by the db engines does not work if we want custom id implementations.
 *    For that reason once you implement the dao and define de ID variable type is responsibility of the developer to fill the IDs values.
 *    There is a attribute called autoGenerated in EntityProperties where the dao generates an uuid v4 id before inserting a record, but this
 *    only works if the ID to use is string. If you want to use as an ID numbers or any other type, it is responsibility of the developer to
 *    fill the id with the correct data an validate is uniqueness before inserting to the database.
 *
 * 8.. Most dao methods returns a bluebird promise. Where Promise.resolve() indicates the operation the dao executed
 * were successful. Any Promise.reject() or error indicates something went wrong. A thrown error is for errors beyond
 * the dao (mongoose errors or database errors).
 *
 * 9.. One mayor difference between a relational databases and a no-sql databases is that no-sql databases
 * (at least lokijs and mongodb)  does not implement any relational-integrity validation at the db level.
 * For that, any dao implemented by janux-persistence does not have the responsibility to validate the content against
 * another daos ( or another documents in different collections) . Hibernate, for example, has the ability to define
 * OneToMany, ManyToOne o ManyToMany relations because in any relational database engine there are constraint rules.
 * Any business rule that requires to validate the content between more that one dao must be implemented outside of the
 * daos, in a service.
 *
 * 10.. Also you can define an EntityPropertiesImpl object. If defined, that abstract dao adds the following features.
 *
 * If EntityPropertiesImpl.timeStamp is true. Then the dao assigns a "insertDate" attribute per each insertMethod and a lastUpdate
 * attribute per each updateMethod.
 *
 * If EntityPropertiesImpl.autoGenerated id true. Then the dao assign to the "id" attribute a random uuid v4 value before inserting a document.
 */
export abstract class AbstractDataAccessObject<t, ID>  implements CrudRepository<t, ID> {

    // The attribute name that has the unique db id.
    public ID_REFERENCE: string = "id";

    // The entity properties.
    protected entityProperties: EntityPropertiesImpl;
    private readonly _log = logger.getLogger("AbstractDataAccessObject");

    constructor(entityProperties: EntityPropertiesImpl) {
        this._log.debug("AbstractDataAccessObject constructor");
        this.entityProperties = entityProperties;
    }

    /**
     * Inserts an object in the database.
     * This method performs the following.
     * 1. Validates if the object does not have an id.
     * 2. Validate if the entity has the correct values by calling the method validateEntity.
     * 3. Validate if the entity is correct against the collection where is going to be inserted by calling the
     * method validateBeforeInsert.
     * 4. Adds a uuid v4 value to the "id" attribute if entityProperties.autoGenerated is true.
     * 5. Adds the dateCreated attribute by calling TimeStampGenerator.generateTimeStampForInsert().
     * 6. Insert the object in the database by calling insertMethod (). This method is implemented by the extended classes.
     * The content to insertMethod can be modified before insertMethod in the database by the method convertBeforeSave.
     * 7. Retrieves the content of insertMethod() and calls  the method convertAfterDbOperation.
     * 8. Returns the inserted object.
     * @param objectToInsert
     * @return {any}
     */
    public insert(objectToInsert: t): Promise<t | ValidationErrorImpl[]> {
        this._log.debug('Call to insertMethod with %j', objectToInsert);
        let entityErrors: ValidationErrorImpl[];
        // Check for an null id in case the dao allows id generation by the dao itself.
        if (this.entityProperties != null && this.entityProperties.autoGenerated === true && objectToInsert[this.ID_REFERENCE] != null) {
            this._log.error('%j has an id', objectToInsert[this.ID_REFERENCE]);
            return Promise.reject('Object has a defined id');
        }
        if ((this.entityProperties == null || this.entityProperties.autoGenerated == null || this.entityProperties.autoGenerated === false) && objectToInsert[this.ID_REFERENCE] == null) {
            return Promise.reject('Object does not have an id and the dao has the attribute entityProperties.autoGenerated as false or undefined');
        }
        // Validate the entity information
        entityErrors = this.validateEntity(objectToInsert);

        if (entityErrors.length === 0) {
            // Call validateBeforeInsert in order to validate the entity against the database.
            return this.validateBeforeInsert(objectToInsert).then((validations: ValidationErrorImpl[]) => {
                this._log.debug("Returned errors from validateBeforeInsert %j: ", validations);
                if (validations.length === 0) {
                    // Generate the timestamp
                    UuidGenerator.assignUUIDToIdAttribute(this.entityProperties, objectToInsert);
                    TimeStampGenerator.generateTimeStampForInsert(this.entityProperties, objectToInsert);
                    return this.insertMethod(this.addExtraValues(this.convertBeforeSave(objectToInsert), objectToInsert))
                        .then((resultInsert: any) => {
                            let result = this.convertAfterDbOperation(resultInsert);
                            result = this.addExtraValues(result, resultInsert);
                            return Promise.resolve(result);
                        });
                } else {
                    return Promise.reject(validations);
                }
            });
        } else {
            this._log.warn('%j has validation errors: \n %j', objectToInsert, entityErrors);
            return Promise.reject(entityErrors);
        }
    }

    /**
     * Insert a list of records to the database.
     * This method performs the following.
     * 1. Validates if the objects does not have an id.
     * 2. Validate if the entities has the correct values by calling the method validateEntity.
     * 4. Adds a uuid v4 value to the "id" attribute if entityProperties.autoGenerated is true.
     * 5. Adds the dateCreated attribute by calling TimeStampGenerator.generateTimeStampForInsert().
     * 6. Insert the object in the database by calling insertManyMethod(). This method is implemented by the extended classes.
     * The content to insertMethod can be modified before insertMethod in the database by the method convertBeforeSave.
     * 6. Retrieves the content of insertManyMethod() and calls  the method convertAfterDbOperation.
     * 7. Returns the inserted objects.
     * This method DOES NOT CHECK DATA CONSISTENCY. The data you are going to insertMethod must be clean.
     * @param objectsToInsert The objects to insertMethod
     * @returns {any} A promise containing the inserted objects, a rejected promise if something went wrong
     */
    public insertMany(objectsToInsert: t[]): Promise<any> {
        this._log.debug('Call to insertMany with %j', objectsToInsert.length);
        const convertedObjectsToInsert: any = [];
        let entityErrors: ValidationErrorImpl[];
        for (const obj of objectsToInsert) {
            if (obj[this.ID_REFERENCE] != null) {
                this._log.error('%j has an id', obj);
                return Promise.reject('Object has a defined id');
            }
        }
        for (const obj of objectsToInsert) {
            entityErrors = this.validateEntity(obj);
            if (entityErrors.length > 0) {
                this._log.warn('%j has validation errors: \n %j', obj, entityErrors);
                return Promise.reject(entityErrors);
            } else {
                // Generate automatic ids.
                UuidGenerator.assignUUIDToIdAttribute(this.entityProperties, obj);
                // Generate the timestamp
                TimeStampGenerator.generateTimeStampForInsert(this.entityProperties, obj);
                convertedObjectsToInsert.push(this.addExtraValues(this.convertBeforeSave(obj), obj));
            }
        }
        // TODO: maybe add a beforeInsertMany abstract method
        return this.insertManyMethod(convertedObjectsToInsert)
            .then((insertedRecords: any[]) => {
                return Promise.resolve(insertedRecords.map((value) => this.addExtraValues(this.convertAfterDbOperation(value), value)));
            });
    }

    /**
     * Update the object.
     * The method performs the following tasks.
     * 1. Validates if the object does have an id.
     * 2. Validate if the entity has the correct values by calling the method validateEntity.
     * 3. Validate if the entity is correct against the collection where is going to be inserted by calling the
     * method validateBeforeUpdate.
     * 4. Adds the lastUpdate attribute by calling TimeStampGenerator.generateTimeStampForUpdate().
     * 5. Update the object in the database by calling updateMethod (). This method is implemented by the extended classes.
     * The content to updateMethod can be modified before updateMethod in the database by the method convertBeforeSave.
     * 6. Retrieves the content of updateMethod() and calls  the method convertAfterDbOperation.
     * 7. Returns the updated object.
     * @param objectToUpdate The object to updateMethod
     * @returns {any} A promise containing the updated object or a reject if something went wrong.
     */
    public update(objectToUpdate: t): Promise<t | ValidationErrorImpl[]> {
        this._log.debug('Call to updateMethod with %j', objectToUpdate);

        let entityErrors: ValidationErrorImpl[];
        if (isBlankString(objectToUpdate[this.ID_REFERENCE])) {
            this._log.error('%j does not have an id', objectToUpdate);
            return Promise.reject('Object does not have an id');
        }
        entityErrors = this.validateEntity(objectToUpdate);
        if (entityErrors.length === 0) {
            return this.validateBeforeUpdate(objectToUpdate)
                .then((validations: ValidationErrorImpl[]) => {
                    this._log.debug("Returned errors from validateBeforeUpdate %j: ", validations);
                    if (validations.length === 0) {
                        TimeStampGenerator.generateTimeStampForUpdate(this.entityProperties, objectToUpdate);
                        return this.updateMethod(this.addExtraValues(this.convertBeforeSave(objectToUpdate), objectToUpdate))
                            .then((resultInsert: any) => {
                                let result = this.convertAfterDbOperation(resultInsert);
                                result = this.addExtraValues(result, resultInsert);
                                return Promise.resolve(result);
                            });
                    } else {
                        return Promise.reject(validations);
                    }
                });
        } else {
            this._log.warn('%j has validation errors: \n %j', objectToUpdate, entityErrors);
            return Promise.reject(entityErrors);
        }
    }

    /**
     * Update an object if the object has an id.
     * Insert a new object if the object does not have an id.
     * @param object The object to insertMethod or updateMethod.
     */
    public saveOrUpdate(object: t): Promise<t | ValidationErrorImpl[]> {
        this._log.debug("Call to saveOrUpdate with object %j", object);
        if (isBlankString(object[this.ID_REFERENCE])) {
            return this.insert(object);
        } else {
            return this.update(object);
        }
    }

    /**
     * Find one record by the id.
     * @param id The id to look for.
     * @return {Promise<t>} Return the document whose id matches the id. If no record is founded then the method
     * returns null.
     */
    public findOne(id: ID): Promise<t> {
        return this.findOneMethod(id)
            .then((resultQuery: any) => {
                return Promise.resolve(_.isNil(resultQuery) ? resultQuery : this.addExtraValues(this.convertAfterDbOperation(resultQuery), resultQuery));
            });
    }

    /**
     * Find all records inside whose ids belongs to the list.
     * @param arrayOfIds The ids to look for.
     * @return {Promise<any[]>} A promise containing the result. If no records are founded, then the method returns
     * an empty array.
     */
    public findByIds(arrayOfIds: ID[]): Promise<t[]> {
        return this.findByIdsMethod(arrayOfIds)
            .then((resultQuery: any[]) => {
                return Promise.resolve(resultQuery.map((value) => this.addExtraValues(this.convertAfterDbOperation(value), value)));
            });
    }

    /**
     * Returns all records.
     * The returned object can be modified if the extended class overrides the method convertAfterDbOperation.
     * @return {Promise<any[]>}
     */
    public findAll(): Promise<t[]> {
        return this.findAllMethod()
            .then((resultQuery: any[]) => {
                return Promise.resolve(resultQuery.map((value) => this.addExtraValues(this.convertAfterDbOperation(value), value)));
            });
    }

    /**
     * Find one that has the attributeName and the value.
     * @param attributeName The attribute to look for.
     * @param value The value to compare.
     * @return {Promise<t>} Return the document that matches the criteria. Returns a reject if there are more than
     * one document that matches the criteria.
     */
    public findOneByAttribute(attributeName: string, value): Promise<t> {
        return this.findOneByAttributeMethod(attributeName, value)
            .then((resultQuery: any) => {
                return Promise.resolve(_.isNil(resultQuery) ? resultQuery : this.addExtraValues(this.convertAfterDbOperation(resultQuery), resultQuery));
            });
    }

    /**
     * Find all the records that has the attributeName and the value.
     * @param attributeName The attribute to look for.
     * @param value The value to compare.
     * @return {Promise<any[]>} Return a list of documents that matches the criteria. If no records are founded, then the method
     * returns an empty array.
     */
    public findByAttribute(attributeName: string, value): Promise<t[]> {
        return this.findByAttributeMethod(attributeName, value)
            .then((resultQuery: any[]) => {
                return Promise.resolve(resultQuery.map((value) => this.addExtraValues(this.convertAfterDbOperation(value), value)));
            });
    }

    /**
     * Find all records whose attribute vales matches with any value of the list.
     * @param attributeName The attribute to look for.
     * @param values The values to match.
     * @return {Promise<any[]>}
     */
    public findByAttributeNameIn(attributeName: string, values: any[]): Promise<t[]> {
        return this.findByAttributeNameInMethod(attributeName, values)
            .then((resultQuery: any[]) => {
                return Promise.resolve(resultQuery.map((value) => this.addExtraValues(this.convertAfterDbOperation(value), value)));
            });
    }

    /**
     * Find all the documents that matches all attributes.
     * @param attributes The attributes-value filters.
     * @return {Promise<any[]>} The objects that matches the criteria.
     */
    public findByAttributesAndOperator(attributes: AttributeFilter[]): Promise<t[]> {
        return this.findByAttributesAndOperatorMethod(attributes)
            .then((resultQuery: any[]) => {
                return Promise.resolve(resultQuery.map((value) => this.addExtraValues(this.convertAfterDbOperation(value), value)));
            });
    }

    /**
     * Find all the documents that matches only one of the attributes.
     * @param attributes The attributes-value filters.
     */
    public findByAttributesOrOperator(attributes: AttributeFilter[]): Promise<t[]> {
        return this.findByAttributesOrOperatorMethod(attributes)
            .then((resultQuery: any[]) => {
                return Promise.resolve(resultQuery.map((value) => this.addExtraValues(this.convertAfterDbOperation(value), value)));
            });
    }

    /**
     * Find all documents that matches with the query criteria. The query for the moment is a mongo-like query object.
     * @param query The query criteria.
     * @return {Promise<any[]>} The objects that matches the query criteria. If no records are founded, then the method
     * returns an empty array.
     */
    public findByQuery(query: any): Promise<t[]> {
        return this.findByQueryMethod(query)
            .then((resultQuery: any[]) => {
                return Promise.resolve(resultQuery.map((value) => this.addExtraValues(this.convertAfterDbOperation(value), value)));
            });
    }

    /**
     * BEGIN METHODS THE DEVELOPER CAN IMPLEMENT
     */

    /**
     * Remove the object.
     * This method must be implemented in order to delete an record to the database.
     * WARNING: This method IS NOT protected by any relational integrity rule because
     * noSql databases doesn't have this feature. Be VERY, VERY careful when calling this method.
     * Nothing (you, the db engine or anything else) will stop the operation once called.
     * @param objectToDelete The object to delete
     */
    public remove(objectToDelete: t): Promise<any> {
        throw new Error("This method is not implemented");
    }

    /**
     * Same as remove. Instead of sending the object, you send the id.
     * @param id The id.
     */
    public removeById(id: any): Promise<any> {
        throw new Error("This method is not implemented");
    }

    /**
     * Returns the amount of records.
     */
    public count(): Promise<number> {
        throw new Error("This method is not implemented");
    }

    /**
     * Delete all records.
     * WARNING: This method IS NOT protected by any relational integrity rule because
     * noSql databases doesn't have this feature. Be VERY, VERY careful when calling this method,
     * you can destroy your database data integrity so easily.
     * Nothing (you, the db engine or anything else) will stop the operation once called.
     */
    public removeAll(): Promise<any> {
        throw new Error("This method is not implemented");
    }

    /**
     * Delete all records that that whose id is in the array.
     * WARNING: This method IS NOT protected by any relational integrity rule because
     * noSql databases doesn't have this feature. Be VERY, VERY careful when calling this method,
     * you can destroy your database data integrity so easily.
     * Nothing (you, the db engine or anything else) will stop the operation once called.
     * @param ids The ids to filter.
     */
    public removeByIds(ids: ID[]): Promise<any> {
        throw new Error("This method is not implemented");
    }

    /**
     * Return all records.
     * This method bust be implemented by the extended classes.
     */
    protected findAllMethod(): Promise<t[]> {
        throw new Error("This method is not implemented");
    }

    /**
     * This method bust be implemented by the extended classes.
     * Query an object by the id.
     * @param id The id.
     */
    protected findOneMethod(id: any): Promise<t> {
        throw new Error("This method is not implemented");
    }

    /**
     * This method bust be implemented by the extended classes.
     * Query several objects by a array of ids.
     * @param arrayOfIds An array of ids.
     */
    protected findByIdsMethod(arrayOfIds: ID[]): Promise<t[]> {
        throw new Error("This method is not implemented");
    }

    /**
     * Perform a query where the attribute must have the value.
     * The implementation should return only one record,
     * and send an error if the query returned more than one result.
     * @param attributeName The attribute to look for.
     * @param value The value to look for.
     */
    protected findOneByAttributeMethod(attributeName: string, value): Promise<t> {
        throw new Error("This method is not implemented");
    }

    /**
     * Perform a query where the attribute must have the value.
     * The implementation should return an array with the results,
     * or an empty array if the query returned nothing.
     * @param attributeName The attribute to look for.
     * @param value The value to look for.
     */
    protected findByAttributeMethod(attributeName: string, value): Promise<t[]> {
        throw new Error("This method is not implemented");
    }

    /**
     * Perform a query where the method filter an attribute by several values.
     * @param attributeName The attribute to look for.
     * @param values The list of values to filter.
     */
    protected findByAttributeNameInMethod(attributeName: string, values: any[]): Promise<t[]> {
        throw new Error("This method is not implemented");
    }

    /**
     * Perform a query with the and operator for every attribute and value
     * @param attributes The attributes to filter
     */
    protected findByAttributesAndOperatorMethod(attributes: AttributeFilter[]): Promise<t[]> {
        throw new Error("This method is not implemented");
    }

    /**
     * Perform a query with the or operator for every attribute and value
     * @param attributes The attributes to filter
     */
    protected findByAttributesOrOperatorMethod(attributes: AttributeFilter[]): Promise<t[]> {
        throw new Error("This method is not implemented");
    }

    /**
     * This method must be implemented in order to insertMethod an object to the database.
     * This method is called from this class and should not be called from outside.
     * @param objectToInsert The object to insertMethod
     */
    protected insertMethod(objectToInsert: t): Promise<t> {
        throw new Error("This method is not implemented");
    }

    /**
     * This method must be implemented in order to updateMethod an object to the database.
     * This method is called from this class and should not be called from outside.
     * @param objectToUpdate The object to updateMethod
     */
    protected updateMethod(objectToUpdate: t): Promise<t> {
        throw new Error("This method is not implemented");
    }

    /**
     * This method must be implemented in order to insertMethod several object to the database.
     * This method is called from this class and should not be called from outside.
     * @param objectsToInsert The objects to insertMethod
     */
    protected insertManyMethod(objectsToInsert: t[]): Promise<t[]> {
        throw new Error("This method is not implemented");
    }

    /**
     * This method must be implemented in order to perform non database validations before an insertMethod or updateMethod,
     * such as non null values, email validations, regexp validations.
     * @param objectToValidate The object to validate
     * @return An array containing the validation errors. If there are no errors then
     * returns an empty array
     */
    protected validateEntity(objectToValidate: t): ValidationErrorImpl[] {
        throw new Error("This method is not implemented");
    }

    /**
     * This method must be implemented in order to perform a query.
     * @param query a mongodb like query.
     */
    protected findByQueryMethod(query: any): Promise<any> {
        throw new Error("This method is not implemented");
    }

    /**
     * This method must be implemented in order to perform database validations before an insertMethod,
     * such as look for duplicated records.
     * @param objectToInsert The object to validate.
     * @return A promise containing the validation errors. If there are no errors then
     * returns an empty array
     */
    protected validateBeforeInsert(objectToInsert: t): Promise<ValidationErrorImpl[]> {
        throw new Error("This method is not implemented");
    }

    /**
     * This method must be implemented in order to perform database validations before an updateMethod,
     * such as look for duplicated records.
     * @param objectToUpdate To object to validate
     * @return A promise containing the validation errors. If there are no errors then
     * returns an empty array
     */
    protected validateBeforeUpdate(objectToUpdate: t): Promise<ValidationErrorImpl[]> {
        throw new Error("This method is not implemented");
    }

    /**
     * This method helps to transforms the object before an insertMethod or updateMethod.
     * Sometimes the dao represents an object that is not ready to be inserted or updated in a database as it is. For example, if the object comes from
     * typescript and has private attributes, mongoose is not going to insertMethod or updateMethod the private attributes.
     * In order to use this method the extended class must override the method.
     * @param object The object to transform.
     * @return {t} The transformed object.
     */
    protected convertBeforeSave(object: t): any {
        this._log.debug("Call to convertBeforeSave abstractDao");
        return object;
    }

    /**
     * This method helps to transforms the data contained in the database to the object represented in the dao.
     * This method is called after successful insertMethod, successful updateMethod or after every query.
     * Sometimes the dao represents an object that is not ready to be inserted or updated as it is. For example, if the object comes from
     * typescript and has private attributes, mongoose is not going to insertMethod or updateMethod the private attributes.
     * In order to use this method the extended class must override the method.
     * @param object
     * @return {any}
     */
    protected convertAfterDbOperation(object: any): t {
        return object;
    }

    /**
     * END METHODS THE DEVELOPER CAN IMPLEMENT
     */

    /**
     * Calling  convertBeforeSave() convertAfterDbOperation(), dateCreated and lastUpdate attributes.
     * This method puts the attributes back to the object.
     * @param obj
     * @param reference
     * @return {any}
     */
    private addExtraValues(obj: any, reference: any): any {
        const id: string = 'id';
        if (_.isNil(reference[id]) === false) {
            obj[id] = reference[id];
        }

        if (_.isNil(reference[TimeStampGenerator.DATE_CREATED_PROPERTY]) === false) {
            obj[TimeStampGenerator.DATE_CREATED_PROPERTY] = reference[TimeStampGenerator.DATE_CREATED_PROPERTY];
        }
        if (_.isNil(reference[TimeStampGenerator.DATE_UPDATED_PROPERTY]) === false) {
            obj[TimeStampGenerator.DATE_UPDATED_PROPERTY] = reference[TimeStampGenerator.DATE_UPDATED_PROPERTY];
        }
        return obj;
    }
}
