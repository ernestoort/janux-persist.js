/**
 * Project janux-persistence
 * Created by ernesto on 6/20/17.
 */

import * as logger from 'log4js';
import {AccountRoleDao} from "../../daos/account-role/account-role-dao";
import {AccountRoleMongoDbSchema} from "../../daos/account-role/mongodb/account-role-mongodb-schema";
import {AccountDaoMongodbImpl} from "../../daos/account/mongodb/account-dao-mongodb-impl";
import {AccountMongoDbSchema} from "../../daos/account/mongodb/account-mongodb-schema";
import {AuthContextMongoDbImpl} from "../../daos/auth-context/mongodb/auth-context-dao-mongodb-impl";
import {AuthContextSchema} from "../../daos/auth-context/mongodb/auth-context-schema";
import {CityDaoMongoDbImpl} from "../../daos/city/mongodb/city-dao-mongodb-impl";
import {CityMongoDbSchema} from "../../daos/city/mongodb/city-mongodb-schema";
import {CountryDaoMongoDbImpl} from "../../daos/country/mongodb/country-dao-mongodb-impl";
import {CountryMongoDbSchema} from "../../daos/country/mongodb/country-mongodb-schema";
import {DisplayNameDaoMongodbImpl} from "../../daos/display-name/mongodb/display-name-dao-mondogb-impl";
import {DisplayNameMongoDbSchema} from "../../daos/display-name/mongodb/display-name-mongodb-schema";
import {PartyDaoMongoDbImpl} from "../../daos/party/mongodb/party-dao-mongodb-impl";
import {PartyMongoDbSchema} from "../../daos/party/mongodb/party-mongodb-schema";
import {PermissionBitMongodbImpl} from "../../daos/permission-bit/monodb/permission-bit-mongodb-impl";
import {PermissionBitMongoDbSchema} from "../../daos/permission-bit/monodb/permission-bit-mongodb-schema";
import {Persistence} from "../../daos/persistence";
import {RolePermissionBitMongoDbSchema} from "../../daos/role-permission-bit/mongodb/role-permission-bit-mongodb-schema";
import {RolePermissionDao} from "../../daos/role-permission-bit/role-permission-bit-dao";
import {RoleDaoMongoDbImpl} from "../../daos/role/mongodb/role-dao-mongodb-impl";
import {RoleMongoDbSchema} from "../../daos/role/mongodb/role-mongodb-schema";
import {StateProvinceDaoMongoDbImpl} from "../../daos/state-province/mongodb/state-province-mongodb-impl";
import {StateProvinceMongoDbSchema} from "../../daos/state-province/mongodb/state-province-mongodb-schema";
import {DbEngineUtilMongodb} from "../../persistence/impl/db-engine-util-mongodb";
import {EntityProperties} from "../../persistence/impl/entity-properties";

export class BootStrapMongoDbDaos {
    public static initMongoDbDaos(mongoose: any) {
        const persistence = Persistence;
        this._log.debug("Call to initMongoDbDaos");
        // Display name
        persistence.displayNameDao = new DisplayNameDaoMongodbImpl(
            new DbEngineUtilMongodb(mongoose.model('displayName', DisplayNameMongoDbSchema))
            , null);

        // Account dao
        persistence.accountDao = new AccountDaoMongodbImpl(
            new DbEngineUtilMongodb(mongoose.model('account', AccountMongoDbSchema)),
            new EntityProperties(false, true));

        // Account role
        persistence.accountRoleDao = new AccountRoleDao(
            new DbEngineUtilMongodb(mongoose.model('accountRole', AccountRoleMongoDbSchema)),
            new EntityProperties(false, true));

        // Auth context
        persistence.authContextDao = new AuthContextMongoDbImpl(
            new DbEngineUtilMongodb(mongoose.model('authorization-context', AuthContextSchema)),
            new EntityProperties(false, true));

        // Permission bit
        persistence.permissionBitDao = new PermissionBitMongodbImpl(
            new DbEngineUtilMongodb(mongoose.model('permission-bit', PermissionBitMongoDbSchema)),
            new EntityProperties(false, true));

        // Role dao
        persistence.roleDao = new RoleDaoMongoDbImpl(
            new DbEngineUtilMongodb(mongoose.model('role', RoleMongoDbSchema)),
            new EntityProperties(false, true));

        // Role permissionBit
        persistence.rolePermissionBitDao = new RolePermissionDao(
            new DbEngineUtilMongodb(mongoose.model('role-permission-bit', RolePermissionBitMongoDbSchema)),
            new EntityProperties(false, true));

        // Country
        persistence.countryDao = new CountryDaoMongoDbImpl(
            new DbEngineUtilMongodb(mongoose.model('country', CountryMongoDbSchema)), null
        );

        // State province
        persistence.stateProvinceDao = new StateProvinceDaoMongoDbImpl(
            new DbEngineUtilMongodb(mongoose.model('state-province', StateProvinceMongoDbSchema)), null
        );

        // City
        persistence.cityDao = new CityDaoMongoDbImpl(
            new DbEngineUtilMongodb(mongoose.model('city', CityMongoDbSchema)), null
        );

        // Party
        persistence.partyDao = new PartyDaoMongoDbImpl(
            new DbEngineUtilMongodb(mongoose.model('party', PartyMongoDbSchema)), null
        );
    }

    private static _log = logger.getLogger("BootStrapMongoDbDaos");
}