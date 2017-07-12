/**
 * Project janux-persistence
 * Created by ernesto on 6/19/17.
 */

import {AuthContextDao} from "../auth-context-dao";
import {AuthContextEntity} from "../auth-context-entity";
import Promise = require("bluebird");
import {DbEngineUtilMongodb} from "../../../persistence/impl/db-engine-util-mongodb";
import {ValidationError} from "../../../persistence/impl/validation-error";
import {IEntityProperties} from "../../../persistence/interfaces/entity-properties";
import {IValidationError} from "../../../persistence/interfaces/validation-error";

export class AuthContextMongoDbImpl extends AuthContextDao {

    constructor(dbEngineUtil: DbEngineUtilMongodb, entityProperties: IEntityProperties) {
        super(dbEngineUtil, entityProperties);
    }

    protected validateBeforeUpdate(objectToUpdate: AuthContextEntity): Promise<IValidationError[]> {
        const query = {
            $and: [
                {_id: {$ne: objectToUpdate.id}},
                {name: {$eq: objectToUpdate.name}}
            ]
        };
        return this.findAllByQuery(query)
            .then((result: AuthContextEntity[]) => {
                const errors: ValidationError[] = [];
                if (result.length > 0) {
                    errors.push(new ValidationError(
                        "name",
                        "There is another record with the same name",
                        objectToUpdate.name));
                }
                return Promise.resolve(errors);
            });
    }
}
