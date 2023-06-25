import { dirname } from "path";
import { JsonConfigFileClass } from "../tools/data";
import { FileClass } from "../tools/file";
import { Logger } from "../tools/logger";
import { PLUGIN_DIR } from "./PluginLoader";
import { TEvent } from "./TEvent";

export namespace GlobalVar {
    export let TMBotConfig: JsonConfigFileClass;
    export let MainLogger: Logger;
    export let Version: {
        "version": [number, number, number],
        "isBeta": boolean,
        "isDebug": boolean
    }
    export function getErrorFile(err: Error, stackLine = 0) {
        let context = err.stack!.split("\n").slice(1)[stackLine];
        if (context.match(/^\s*[-]{4,}$/)) {
            return context;
        }
        let matchRes = context.match(/at (?:(.+?)\s+\()?(?:(.+?):(\d+)(?::(\d+))?|([^)]+))\)?/);
        if (!matchRes) {
            return "Unknown";
        }
        return matchRes[2];
    }

    export function getPluginName(content: string) {
        content = content.replace(/\\/g, "/");
        let isPlugin = false;
        let name = content;
        let pluginDir = FileClass.getStandardPath(PLUGIN_DIR)!.replace(/\\/g, "/");
        if (content.indexOf(pluginDir) != -1) {
            isPlugin = true;
            let tmp = content;
            let isLast = false;
            while (!isLast) {
                let tmp2 = dirname(tmp) + "/";
                if (tmp2 == pluginDir) {
                    name = tmp.replace(tmp2, "").replace("/", "");
                    isLast = true;
                } else if (tmp2 == tmp) { isLast = true; }
                tmp = tmp2;
            }
        }
        return { isPlugin, name };
    }

    /** 关闭TMBot(llse环境将不使用process.exit) */
    export async function TMBotStop() {
        MainLogger.info("正在请求关闭...");
        let list: Promise<any>[] = [];
        GlobalEvent.onTMBotStop.fire("TMBotProcess_Event_StopRequest", null, (pro) => { list.push(pro); });
        await Promise.all(list);
        MainLogger.info(`TMBot退出...`);
        typeof (ll) == "undefined" && process.exit(0);
    }
};

export namespace GlobalEvent {
    export let onTMBotStop = new TEvent<(fn: (asyncFn: Promise<any>) => void) => void>({ "error": (...args: any[]) => { return GlobalVar.MainLogger.error(...args); } });
}