/**
 * Project janux-persistence
 * Created by ernesto on 6/16/17.
 */

import {RoleDao} from "../role-dao";
import {RoleEntity} from "../role-entity";
import Promise = require("bluebird");
import {DbEngineUtilMongodb} from "../../../persistence/impl/db-engine-util-mongodb";
import {ValidationError} from "../../../persistence/impl/validation-error";
import {IEntityProperties} from "../../../persistence/interfaces/entity-properties";
import {IValidationError} from "../../../persistence/interfaces/validation-error";

export class RoleDaoMongoDbImpl extends RoleDao {

    constructor(dbEngineUtil: DbEngineUtilMongodb, entityProperties: IEntityProperties) {
        super(dbEngineUtil, entityProperties);
    }

    protected validateBeforeUpdate<t>(objectToUpdate: RoleEntity): Promise<IValidationError[]> {
        const query = {
            $and: [
                {name: {$eq: objectToUpdate.name}},
                {_id: {$ne: objectToUpdate.id}}
            ]
        };
        return this.findAllByQuery(query)
            .then((result: RoleEntity[]) => {
                const errors: ValidationError[] = [];
                if (result.length > 0) {
                    errors.push(new ValidationError(
                        "name",
                        "There is another role with the same name",
                        objectToUpdate.name));
                    return Promise.resolve(errors);
                } else {
                    return this.validateParentRole(objectToUpdate);
                }
            });
    }
}
