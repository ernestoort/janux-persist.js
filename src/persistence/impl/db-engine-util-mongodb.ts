/**
 * Project janux-persistence
 * Created by ernesto on 6/12/17.
 */
import * as logger from 'log4js';
import Promise = require("bluebird");
import {Model} from "mongoose";
import {IDbEngineUtil} from "../interfaces/db-engine-util-method";
import {MongoDbUtil} from "../util/mongodb-util.js";

export class DbEngineUtilMongodb implements IDbEngineUtil {

    public model: Model<any>;
    private _log = logger.getLogger("DbEngineUtilMongodb");

    constructor(model: Model<any>) {
        this.model = model;
    }

    findOneById(id): Promise<any> {
        this._log.debug("Call to findOneById with id: %j", id);
        return MongoDbUtil.findOneById(this.model, id);
    }

    findAllByIds(arrayOfIds: any[]): Promise<any> {
        this._log.debug("Call to findAllByIds with arrayOfIds: %j", arrayOfIds);
        return MongoDbUtil.findAllByIds(this.model, arrayOfIds);
    }

    remove(objectToDelete: any): Promise<any> {
        this._log.debug("Call to remove with objectToDelete: %j", objectToDelete);
        return MongoDbUtil.remove(this.model, objectToDelete);
    }

    count(): Promise<number> {
        this._log.debug("Call to count.");
        return MongoDbUtil.count(this.model);
    }

    deleteAll(): Promise<any> {
        this._log.debug("Call to deleteAll.");
        return MongoDbUtil.deleteAll(this.model);
    }

    findOneByAttribute(attributeName: string, value): Promise<any> {
        this._log.debug("Call to findOneByAttribute with attributeName: %j, value: %j", attributeName, value);
        return MongoDbUtil.findOneByAttribute(this.model, attributeName, value);
    }

    findAllByAttribute(attributeName: string, value): Promise<any[]> {
        this._log.debug("Call to findAllByAttribute with attributeName: %j, value: %j", attributeName, value);
        return MongoDbUtil.findAllByAttribute(this.model, attributeName, value);
    }

    findAllByAttributeNameIn(attributeName: string, values: any[]): Promise<any> {
        this._log.debug("Call to findAllByAttributeNameIn with attributeName: %j, values: %j", attributeName, values);
        return MongoDbUtil.findAllByAttributeNameIn(this.model, attributeName, values);
    }

    insertMethod(objectToInsert: any): Promise<any> {
        this._log.debug("Call to insertMethod with objectToInsert: %j", objectToInsert);
        return MongoDbUtil.insert(this.model, objectToInsert);
    }

    updateMethod(objectToUpdate: any): Promise<any> {
        this._log.debug("Call to updateMethod with objectToUpdate: %j", objectToUpdate);
        return MongoDbUtil.update(this.model, objectToUpdate);
    }

    insertManyMethod(objectsToInsert: any[]): Promise<any> {
        this._log.debug("Call to insertManyMethod with objectsToInsert: %j", objectsToInsert);
        return MongoDbUtil.insertMany(this.model, objectsToInsert);
    }
}
