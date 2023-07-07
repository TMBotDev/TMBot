import { isPromise } from "util/types";
import { Logger } from "../../tools/logger";
import { GlobalVar } from "./Global";
import { PluginPackage } from "../PluginLoader";

function PrintErrorIn(e: Error, log: { "error": (...args: any[]) => void }) {
    let ErrorFile = GlobalVar.getErrorFile(e);
    let res = GlobalVar.getPluginName(ErrorFile);
    let package_ = PluginPackage.getPackage(res.name);
    let ver = "v0.0.0";
    if (package_) {
        ver = package_.version || ver;
        ver[0].toLowerCase() != "v" ? ver = "v" + ver : "";
    } else {
        ver = `v${GlobalVar.Version.version.join(".")}${GlobalVar.Version.isBeta ? "Beta" : ""}`;
    }
    // console.log(ver)
    log.error(`In ${res.isPlugin ? "Plugin" : "File"}: ${res.name}[${ver}]`);
}

export class TEvent<FUNCTION_T extends (...args: any[]) => any | Promise<any>>{
    private num = 0;
    constructor(
        private log: Logger | { "error": (...args: any[]) => any },
        private funcList: { [key: string]: (time: number, ...params: Parameters<FUNCTION_T>) => ReturnType<FUNCTION_T> } = {}
    ) { }
    on(func: FUNCTION_T) {
        let name = (() => {
            try {
                if (func.name) { return func.name; }
                let res = ((func.toString().match(/function\s*([^(]*)\(/))![1]).trim();
                if (res == "*") { throw new Error("NameError"); }
                return res;
            } catch (_) {
                return `_NOT_FUNCTION_NAME_(${this.num++})`;
            }
        })();
        this.funcList[name] = (_t, ...p) => {
            return func(...p);
        };
        return name;
    }
    onEx(func: (time: number, ...params: Parameters<FUNCTION_T>) => ReturnType<FUNCTION_T>) {
        let name = (() => {
            try {
                if (func.name) { return func.name; }
                let res = ((func.toString().match(/function\s*([^(]*)\(/))![1]).trim();
                if (res == "*") { throw new Error("NameError"); }
                return res;
            } catch (_) {
                return `_NOT_FUNCTION_NAME_(${this.num++})`;
            }
        })();
        this.funcList[name] = func;
        return name;
    }
    un(name: string) {
        delete this.funcList[name];
        return true;
    }
    clear() {
        this.funcList = {};
        return true;
    }
    size() {
        return Object.keys(this.funcList).length;
    }
    fire(api: string, time: number | null | undefined, ...params: Parameters<FUNCTION_T>) {
        let keys = Object.keys(this.funcList);
        let l = keys.length, i = 0;
        if (time == null) {
            time = Date.now();
        }
        while (i < l) {
            let funcName = keys[i];
            let func = this.funcList[funcName];
            try {
                let res = func(time, ...params);
                if (isPromise(res)) {
                    (res as Promise<unknown>).catch((e) => {
                        this.log.error(`Error in: ${api}(${funcName})[Promise]`);
                        if (!(e instanceof Error)) {
                            this.log.error("未知异常消息: ", e);
                            return;
                        }
                        this.log.error(e.stack);
                        PrintErrorIn(e, this.log);
                    });
                }
            } catch (e: any) {
                this.log.error(`Error in: ${api}(${funcName})`);
                if (!(e instanceof Error)) {
                    this.log.error("未知异常消息: ", e);
                    return;
                }
                this.log.error(e.stack);
                PrintErrorIn(e, this.log);
            }
            i++;
        }
    }

    toString() { return `<Class::TEvent>`; }
}