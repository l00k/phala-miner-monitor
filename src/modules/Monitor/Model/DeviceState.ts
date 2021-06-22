import { Model, AbstractModel } from '@/core/Store';
import { Property, Initializable } from '@100k/intiv/Initializable';
import moment from 'moment';


export enum ContainerState
{
    NotRunning = 'NotRunning',
    InSync = 'InSync',
    NotInitiated = 'NotInitiated',
    Running = 'Running',
}


const containerStateToTagTypeMap = {
    [ContainerState.NotRunning]: 'is-danger',
    [ContainerState.InSync]: 'is-warning',
    [ContainerState.NotInitiated]: 'is-warning',
    [ContainerState.Running]: 'is-success',
};


export class PartInfo
    extends Initializable<PartInfo>
{

    @Property()
    public state? : ContainerState = ContainerState.NotRunning;

    @Property()
    public syncProgress? : number = 0;

    @Property()
    public temperature? : number = 0;

}


type TagProps = {
    type : string,
    hint : string,
}

export default class DeviceState
    extends Initializable<DeviceState>
{

    @Property()
    public cpu : PartInfo;

    @Property()
    public node : PartInfo = new PartInfo();

    @Property()
    public runtime : PartInfo = new PartInfo();

    @Property()
    public host : PartInfo = new PartInfo();

    @Property()
    public updatedAt : Date;

    public get isOutdated() : boolean
    {
        return moment().diff(this.updatedAt, 'minutes') > 15;
    }

    public get updateTag() : TagProps
    {
        const hint = 'Last update: ' + moment(this.updatedAt).format('YYYY-MM-DD HH:mm:ss');
        return {
            type: this.isOutdated ? 'is-warning' : 'is-success',
            hint,
        };
    }

    public get cpuTag() : TagProps
    {
        const temperature = this.cpu.temperature;
        let hint : string = `Temp: ${ temperature ? temperature.toFixed(1) : 'unknown' }°C`;

        let type = (this.isOutdated ? 'is-outdated ' : '');
        type += temperature < 60
            ? 'is-success'
            : temperature < 80
                ? 'is-warning'
                : 'is-danger';

        return {
            type,
            hint,
        };
    }

    public get nodeTag() : TagProps
    {
        let hint : string = <any> this.node.state;

        if (this.node.state === ContainerState.InSync) {
            const progress = this.node.syncProgress * 100;
            hint += ` / Progress: ${ progress.toFixed(2) }%`;
        }

        return {
            type: containerStateToTagTypeMap[this.node.state] + (this.isOutdated ? ' is-outdated' : ''),
            hint,
        };
    }

    public get runtimeTag() : TagProps
    {
        let hint : string = <any> this.runtime.state;
        return {
            type: containerStateToTagTypeMap[this.runtime.state] + (this.isOutdated ? ' is-outdated' : ''),
            hint,
        };
    }

    public get hostTag() : TagProps
    {
        let hint : string = <any> this.host.state;
        return {
            type: containerStateToTagTypeMap[this.host.state] + (this.isOutdated ? ' is-outdated' : ''),
            hint,
        };
    }

    public constructor(data? : Partial<DeviceState>)
    {
        super();
        this.setData(data);
    }

}
