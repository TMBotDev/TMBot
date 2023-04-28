import { isPromise } from "util/types";
import { Logger } from "../tools/logger";

export class Event<FUNCTION_T extends (...args: any[]) => any | Promise<any>>{
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
                        this.log.error((e instanceof Error) ? e.stack : e.toString());
                    });
                }
            } catch (e) {
                this.log.error(`Error in: ${api}(${funcName})`);
                this.log.error((e instanceof Error) ? e.stack : (e as string).toString());
            }
            i++;
        }
    }
}