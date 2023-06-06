/*
  SPDX-License-Identifier: Apache-2.0
*/

import {Object, Property} from 'fabric-contract-api';
import { AssetStatus } from './types';
@Object()
export class Asset {
    @Property()
    public docType?: string;

    @Property()
    public ID: string;

    @Property()
    public Color: string;

    @Property()
    public Size: number;

    @Property()
    public Owner: string;

    @Property()
    public AppraisedValue: number;

    @Property()
    public Status: AssetStatus;
}
@Object()
export class UserEthereumMapping {
    @Property()
    public userId: string;
    
    @Property()
    public ethereumAddress: string;
}