import { JsonConfigFileClass } from "../tools/data";
import { Logger } from "../tools/logger";
import { TEvent } from "./TEvent";

export namespace GlobalVar {
    export let TMBotConfig: JsonConfigFileClass;
    export let MainLogger: Logger;
    export let Version: {
        "version": [number, number, number],
        "isBeta": boolean,
        "isDebug": boolean
    }
};

export namespace GlobalEvent {
    export let onTMBotStop = new TEvent<(fn: (asyncFn: Promise<any>) => void) => void>(GlobalVar.MainLogger);
}