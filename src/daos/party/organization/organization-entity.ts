/**
 * Project janux-persistence
 * Created by ernesto on 6/20/17.
 */

import {PostalAddress} from "../contact/address/postal-address";
import {EmailAddress} from "../contact/email/email-address";
import {PhoneNumber} from "../contact/phone/phone-number";
import {IPartyEntity} from "../iParty-entity";

export class OrganizationEntity implements IPartyEntity {
    public id: string;
    public idAccount: string;
    public type: string;
    public name: string;
    public displayName: string;
    public phones: PhoneNumber[] = [];
    public emails: EmailAddress[] = [];
    public addresses: PostalAddress[] = [];
}
