/*
 * Project janux-persistence
 * Created by ernesto on 6/12/17.
 */
import * as logger from 'log4js';
import Promise = require("bluebird");
import {Model} from "mongoose";
import {ICrudRepository} from "../../interfaces/crud-reporitory";
import {MongoDbUtil} from "../../util/mongodb-util.js";
import {AttributeFilter} from "../dao/attribute-filter";

/**
 * this class in an implementation of ICrudRepository in order to use mongodb as the db engine.
 */
export class MongoDbRepository implements ICrudRepository {
    public model: Model<any>;

    private _log = logger.getLogger("MongoDbRepository");

    constructor(model: Model<any>) {
        this.model = model;
    }

    /**
     * Find one record by the id.
     * @param id The id to look for.
     * @return {Promise<any>} Return the document whose id matches the id. If no record is founded then the method
     * returns null.
     */
    findOneById(id): Promise<any> {
        this._log.debug("Call to findOneById with id: %j", id);
        return MongoDbUtil.findOneById(this.model, id);
    }

    /**
     * Find all the documents inside a model whose ids belongs to the list.
     * @param arrayOfIds The ids to look for.
     * @return {Promise<any>} A promise containing the result. If no records are founded, then the method returns
     * an empty array.
     */
    findAllByIds(arrayOfIds: any[]): Promise<any> {
        this._log.debug("Call to findAllByIds with arrayOfIds: %j", arrayOfIds);
        return MongoDbUtil.findAllByIds(this.model, arrayOfIds);
    }

    /**
     * Removes a document inside the collection.
     * @param objectToDelete The object to delete. This object must contain an attribute called "id" as string in
     * order to know which document to delete.
     * @return {Promise<any>} a promise indicating the operation was successful.
     */
    remove(objectToDelete: any): Promise<any> {
        this._log.debug("Call to remove with objectToDelete: %j", objectToDelete);
        return MongoDbUtil.remove(this.model, objectToDelete);
    }

    /**
     * Count all documents in the model.
     * @return {Promise<any>} The amount of documents inside the collection.
     */
    count(): Promise<number> {
        this._log.debug("Call to count.");
        return MongoDbUtil.count(this.model);
    }

    /**
     * Delete all documents inside the model.
     * @return {Promise<any>} Returns a promise indicating the delete was successful.
     */
    deleteAll(): Promise<any> {
        this._log.debug("Call to deleteAll.");
        return MongoDbUtil.deleteAll(this.model);
    }

    /**
     * Delete all documents inside the model whose ids matches the list.
     * @param ids A list of ids.
     * @return {Promise} Returns a promise indicating the delete was successful.
     */
    deleteAllByIds(ids: string[]): Promise<any> {
        return MongoDbUtil.deleteAllByIds(this.model, ids);
    }

    /**
     * Find one document inside the model that has the attributeName and the value.
     * @param attributeName The attribute to look for.
     * @param value The value to compare.
     * @return {Promise<any>} Return the document that matches the criteria. Returns a reject if there are more than
     * one document that matches the criteria.
     */
    findOneByAttribute(attributeName: string, value): Promise<any> {
        this._log.debug("Call to findOneByAttribute with attributeName: %j, value: %j", attributeName, value);
        return MongoDbUtil.findOneByAttribute(this.model, attributeName, value);
    }

    /**
     * Find all the documents inside the model that has the attributeName and the value.
     * @param attributeName The attribute to look for.
     * @param value The value to compare.
     * @return {Promise<any>} Return a list of documents that matches the criteria. If no records are founded, then the method
     * returns an empty array.
     */
    findAllByAttribute(attributeName: string, value): Promise<any[]> {
        this._log.debug("Call to findAllByAttribute with attributeName: %j, value: %j", attributeName, value);
        return MongoDbUtil.findAllByAttribute(this.model, attributeName, value);
    }

    /**
     * Find all records whose attribute vales matches with any value of the list.
     * @param attributeName The attribute to look for.
     * @param values The values to match.
     * @return {Promise<any>} The records that matches with the query
     */
    findAllByAttributeNameIn(attributeName: string, values: any[]): Promise<any> {
        this._log.debug("Call to findAllByAttributeNameIn with attributeName: %j, values: %j", attributeName, values);
        return MongoDbUtil.findAllByAttributeNameIn(this.model, attributeName, values);
    }

    /**
     * Insert a document inside the collection.
     * @param objectToInsert The data to insert.
     * @return {Promise<any>} The inserted object. The object contains the id generated by mongodb in a
     * attribute called "id" as string.
     */
    insert(objectToInsert: any): Promise<any> {
        this._log.debug("Call to insert with objectToInsert: %j", objectToInsert);
        return MongoDbUtil.insert(this.model, objectToInsert);
    }

    /**
     * Update the document info inside the collection.
     * @param objectToUpdate The data to update. This object must have an attribute called "id" as string in order
     * to know which document is going to be updated.
     * @return {Promise<any>} A promise containing the updated object.
     */
    update(objectToUpdate: any): Promise<any> {
        this._log.debug("Call to update with objectToUpdate: %j", objectToUpdate);
        return MongoDbUtil.update(this.model, objectToUpdate);
    }

    /**
     * Insert many documents at once inside the collection.
     * @param objectsToInsert The objects to insert.
     * @return {Promise<any>} Returns a promise containing the inserted objects. Each inserted object
     * contains the generated id of mongodb inside a attribute called "id" as string.
     */
    insertMany(objectsToInsert: any[]): Promise<any> {
        this._log.debug("Call to insertMany with objectsToInsert: %j", objectsToInsert);
        return MongoDbUtil.insertMany(this.model, objectsToInsert);
    }

    /**
     * Return all objects
     * @return {Promise<any>} A promise containing all objects.
     */
    findAll(): Promise<any[]> {
        this._log.debug("Call to findAll");
        return MongoDbUtil.findAllByQuery(this.model, {});
    }

    /**
     * Find all the documents that matches all attributes.
     * @param attributes The attributes-value filters.
     * @return {Promise<any>} The objects that matches the criteria.
     */
    public findAllByAttributesAndOperator(attributes: AttributeFilter[]): Promise<any[]> {
        this._log.debug("Call to findAllByAttributesAndOperator with attributes: %j", attributes);
        const query = {
            $and: []
        };
        for (const attribute of attributes) {
            const condition = {};
            condition[attribute.attributeName] = {$eq: attribute.value};
            query.$and.push(condition);
        }
        return MongoDbUtil.findAllByQuery(this.model, query);
    }

    /**
     * Find all the documents that matches only one of the attributes.
     * @param attributes The attributes-value filters.
     * @return {Promise<any>} The objects that matches the criteria.
     */
    public findAllByAttributesOrOperator(attributes: AttributeFilter[]): Promise<any[]> {
        this._log.debug("Call to findAllByAttributesOrOperator with attributes: %j", attributes);
        const query = {
            $or: []
        };
        for (const attribute of attributes) {
            const condition = {};
            condition[attribute.attributeName] = {$eq: attribute.value};
            query.$or.push(condition);
        }
        return MongoDbUtil.findAllByQuery(this.model, query);
    }

    /**
     * Find all documents that matches with the query criteria. The query is a mongo-like query object.
     * @param query The query criteria.
     * @return {Promise<any>} The objects that matches the query criteria. If no records are founded, then the method
     * returns an empty array.
     */
    public findAllByQuery(query: any): Promise<any[]> {
        this._log.debug("Call to findAllByQuery with query: %j", query);
        return MongoDbUtil.findAllByQuery(this.model, query);
    }

    /**
     * Remove a document whose id matches with the id parameter.
     * @param id The id query criteria.
     * @return {Promise<any>} Returns a promise indicating the delete was successful.
     */
    public removeById(id: string): Promise<any> {
        this._log.debug("Call to removeById with id: %j", id);
        return MongoDbUtil.removeById(this.model, id);
    }
}