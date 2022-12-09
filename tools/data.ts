import { FileClass } from "./file";



let ini = new class {
    constructor() { };//空构造函数
    parse(str: string) {
        if (typeof (str) != "string") { throw new Error("The passed parameter must be a string!"); }
        let lines = str.replace(/\r\n/, "\n").replace(/\r/, "\n").split("\n"),
            l = lines.length, i = 0, res: any = {}, nowel = "";
        while (i < l) {
            let lstr = lines[i++].trim(),
                fh = lstr.indexOf(";");
            if (fh != -1) { lstr = lstr.substring(0, fh).trim(); }//除注去释
            if (lstr[0] == ";") { continue; }//跳过注释
            if (lstr[0] == "[") {
                let end = lstr.indexOf("]");
                if (end == -1) { throw new Error("No closing statement!"); }
                let cl = lstr.substring(1, end);
                res[cl] = {};
                nowel = cl;
            } else {
                let [key, value] = lstr.split("=", 2);
                if (key != "") {
                    res[nowel][key] = value;
                }
            }
        }
        return res;
    };
    stringify(obj: any) {
        if (Object.prototype.toString.call(obj) != '[object Object]') {
            throw new Error("The parameter must be an object!");
        }
        let els = Object.keys(obj), l = els.length, i = 0, nowel = "", strArr = [];
        while (i < l) {
            let el = els[i++];
            if (Object.prototype.toString.call(obj[el]) != '[object Object]') {
                strArr.push(`[${nowel}]`);
                strArr.push(`${el}=${obj[el]}`);
            } else {
                strArr.push(`[${el}]`);
                nowel = el;
                let keys = Object.keys(obj[el]), l = keys.length, i = 0;
                while (i < l) {
                    let [key, value] = [keys[i], obj[nowel][keys[i]]];
                    strArr.push(`${key}=${value}`);
                    i++;
                }
            }
        }
        return strArr.join("\n");
    };
}

export class JsonConfigFileClass {
    #Path: string;
    #TextCache: string;
    #Cache: any;
    #TimeStamp: number;
    #isTasking: boolean;
    #isDestroy: boolean;
    constructor(path: string, defaultStr: string = "{}") {
        this.#Path = path;
        this.#TimeStamp = 0;
        let fileText = FileClass.readFrom(path);
        if (fileText == null) {
            fileText = defaultStr;
            this._saveData(JSON.parse(fileText));
        }
        this.#TextCache = fileText;
        this.#isTasking = false;
        this.#isDestroy = false;
    }
    _getCache() {
        if (this.#isDestroy) { throw new Error(`JsonConfigFileClass::_GetCache: Illegal use of destroyed object<${this.#Path}>!`); }
        let nowTime = Date.now();
        if ((nowTime - this.#TimeStamp) > 500) {
            this.#Cache = JSON.parse(this.#TextCache);
            this.#TimeStamp = nowTime;
        }
        return this.#Cache;
    }
    _saveData(obj: any) {
        if (this.#isDestroy) { throw new Error(`JsonConfigFileClass::_SaveData: Illegal use of destroyed object<${this.#Path}>!`); }
        this.#Cache = obj;
        if (!this.#isTasking) {
            this.#isTasking = true;
            process.nextTick(() => {
                this.#TextCache = JSON.stringify(this.#Cache);
                FileClass.writeTo(this.#Path, this.#TextCache);
                this.#isTasking = false;
            });
        }
        return true;
    }
    init(key: string, content: any) {
        let cache = this._getCache();
        let oldData = cache[key];
        if (oldData == undefined) {
            cache[key] = content;
            this._saveData(cache);
        }
        return oldData;
    }
    getKeys() {
        return Object.keys(this._getCache());
    }
    get(key: string, defaultStr: any = null) {
        let cache = this._getCache();
        let res = cache[key];
        return (res === undefined ? defaultStr : res);
    }
    set(key: string, content: any) {
        let cache = this._getCache();
        cache[key] = content;
        return this._saveData(cache);
    }
    delete(key: string) {
        let cache = this._getCache();
        if (cache[key] == undefined) { return false; }
        delete cache[key];
        return this._saveData(cache);
    }
    reload() {
        if (this.#isDestroy) { throw new Error(`JsonConfigFileClass::Reload: Illegal use of destroyed object<${this.#Path}>!`); }
        let fileText = FileClass.readFrom(this.#Path);
        if (fileText == null) {
            throw new Error(`The original file <${this.#Path}> disappeared!`);
        }
        this.#TextCache = fileText;
        this.#TimeStamp = 0;
        return true;
    }
    close() {
        if (this.#isDestroy) { throw new Error(`JsonConfigFileClass::Close: Illegal use of destroyed object<${this.#Path}>!`); }
        let cache = this._getCache();
        this.#isDestroy = true;
        return this._saveData(cache);
    }
    getPath() {
        if (this.#isDestroy) { throw new Error(`JsonConfigFileClass:GetPath: Illegal use of destroyed object<${this.#Path}>!`); }
        return this.#Path;
    }
    read() {
        if (this.#isDestroy) { throw new Error(`JsonConfigFileClass::Read: Illegal use of destroyed object<${this.#Path}>!`); }
        return JSON.stringify(this._getCache(), null, 2);
    }
    write(content: string) {
        if (this.#isDestroy) { throw new Error(`JsonConfigFileClass::Write: Illegal use of destroyed object<${this.#Path}>!`); }
        this.#TextCache = content;
        this.#TimeStamp = 0;
        FileClass.writeTo(this.#Path, content);
        this._getCache();
        return true;
    }
}

export class IniConfigFileClass {
    #Path: string;
    #TextCache: string;
    #Cache: any;
    #TimeStamp: number;
    #isTasking: boolean;
    #isDestroy: boolean;
    constructor(path: string, defaultStr: string = "{}") {
        this.#Path = path;
        this.#TimeStamp = 0;
        let fileText = FileClass.readFrom(path);
        if (fileText == null) {
            fileText = defaultStr;
        }
        this.#TextCache = fileText;
        this.#isTasking = false;
        this.#isDestroy = false;
    }
    _getCache() {
        if (this.#isDestroy) { throw new Error(`IniConfigFileClass::_GetCache: Illegal use of destroyed object<${this.#Path}>!`); }
        let nowTime = Date.now();
        if ((nowTime - this.#TimeStamp) > 500) {
            this.#Cache = ini.parse(this.#TextCache);
            this.#TimeStamp = nowTime;
        }
        return this.#Cache;
    }
    _saveData(obj: any) {
        if (this.#isDestroy) { throw new Error(`IniConfigFileClass::_SaveData: Illegal use of destroyed object<${this.#Path}>!`); }
        this.#Cache = obj;
        if (!this.#isTasking) {
            this.#isTasking = true;
            process.nextTick(() => {
                this.#TextCache = ini.stringify(this.#Cache);
                FileClass.writeTo(this.#Path, this.#TextCache);
                this.#isTasking = false;
            });
        }
        return true;
    }
    init(sec: string, key: string, content: any) {
        let cache = this._getCache();
        let oldData = (cache[sec] == null ? null : cache[sec][key]);
        if (oldData == undefined) {
            let tmp = (cache[sec] || (() => { cache[sec] = {}; return cache[sec]; })());
            tmp[key] = content;
            this._saveData(cache);
        }
        return oldData;
    }
    get(sec: string, key: string, defaultStr: any = null) {
        let cache = this._getCache();
        let tmp = (cache[sec] || (() => { cache[sec] = {}; return cache[sec]; })());
        let res = tmp[key];
        return (res === undefined ? defaultStr : res);
    }
    getStr(sec: string, key: string, defaul: string = "") {
        return this.get(sec, key, defaul);
    }
    getInt(sec: string, key: string, defaul = 0) {
        let res = this.get(sec, key, null);
        if (res == null) {
            return defaul;
        } else {
            return parseInt(res);
        }
    }
    getFloat(sec: string, key: string, defaul: number = 0.0) {
        let res = this.get(sec, key, null);
        if (res == null) {
            return defaul;
        } else {
            return parseFloat(res);
        }
    }
    getBool(sec: string, key: string, defaul: boolean = false) {
        let res = this.get(sec, key, null);
        if (res == null) {
            return defaul;
        } else {
            try {
                return Boolean(JSON.parse(res));
            } catch (_) { return defaul; }
        }
    }
    set(sec: string, key: string, content: any) {
        let cache = this._getCache();
        let tmp = (cache[sec] || (() => { cache[sec] = {}; return cache[sec]; })());
        tmp[key] = content;
        return this._saveData(cache);
    }
    delete(sec: string, key: string) {
        let cache = this._getCache();
        if (cache[sec] == null) { return false; }
        delete cache[sec][key];
        if (Object.keys(cache[sec]).length == 0) {
            delete cache[sec];
        }
        return this._saveData(cache);
    }
    reload() {
        if (this.#isDestroy) { throw new Error(`IniConfigFileClass::Reload: Illegal use of destroyed object<${this.#Path}>!`); }
        let fileText = FileClass.readFrom(this.#Path);
        if (fileText == null) {
            throw new Error(`The original file <${this.#Path}> disappeared!`);
        }
        this.#TextCache = fileText;
        this.#TimeStamp = 0;
        return true;
    }
    close() {
        if (this.#isDestroy) { throw new Error(`IniConfigFileClass::Close: Illegal use of destroyed object<${this.#Path}>!`); }
        let cache = this._getCache();
        this.#isDestroy = true;
        return this._saveData(cache);
    }
    getPath() {
        if (this.#isDestroy) { throw new Error(`IniConfigFileClass:GetPath: Illegal use of destroyed object<${this.#Path}>!`); }
        return this.#Path;
    }
    read() {
        if (this.#isDestroy) { throw new Error(`IniConfigFileClass::Read: Illegal use of destroyed object<${this.#Path}>!`); }
        return JSON.stringify(this._getCache(), null, 2);
    }
    write(content: string) {
        if (this.#isDestroy) { throw new Error(`IniConfigFileClass::Write: Illegal use of destroyed object<${this.#Path}>!`); }
        this.#TextCache = content;
        this.#TimeStamp = 0;
        FileClass.writeTo(this.#Path, content);
        this._getCache();
        return true;
    }
}

// import * as deasync from "deasync";

// // class LevelSync {
// //     static Set(lv: leveldb.Level, key: string, val: string) {
// //         let res: any = null, isExecuted = false, code = false;
// //         lv.put(key, val, (err, res1) => {
// //             if (err != null) {
// //                 res = err;
// //                 code = false;
// //             } else {
// //                 res = res1;
// //                 code = true;
// //             }
// //             isExecuted = true;
// //         });
// //         while (true) {
// //             if (!isExecuted) { deasync.sleep(1); continue; }
// //             if (code) {
// //                 return res;
// //             } else { throw res; }
// //         }
// //     }
// //     static Get(lv: leveldb.Level, key: string): string | null {
// //         let res: any = null, isExecuted = false, code = false;
// //         lv.get(key, (err, res1) => {
// //             if (err != null) {
// //                 res = err;
// //                 code = false;
// //             } else {
// //                 res = res1;
// //                 code = true;
// //             }
// //             isExecuted = true;
// //         });
// //         while (true) {
// //             if (!isExecuted) { deasync.sleep(1); continue; }
// //             if (code) {
// //                 return res;
// //             } else { throw res; }
// //         }
// //     }
// //     static GetKeys(lv: leveldb.Level) {
// //         let keys: string[] = [], keysO = lv.keys(), isExecuted = false;
// //         let GKS = (async function () {
// //             for await (let key of keysO) {
// //                 keys.push(key);
// //             }
// //             isExecuted = true;
// //         });
// //         GKS();
// //         while (true) {
// //             if (!isExecuted) { deasync.sleep(1); continue; }
// //             return keys;
// //         }
// //     }
// //     static ForEach(lv: leveldb.Level, cb: (val: string, key: string) => boolean): string | null {
// //         let res: string | null = null, keysO = lv.keys(), isExecuted = false;
// //         let GKS = (async function () {
// //             for await (let key of keysO) {
// //                 if (cb(await lv.get(key), key)) {
// //                     res = key;
// //                     break;
// //                 }
// //             }
// //             isExecuted = true;
// //         });
// //         GKS();
// //         while (true) {
// //             if (!isExecuted) { deasync.sleep(1); continue; }
// //             return res;
// //         }
// //     }
// // }



// declare global {
//     var PlayerInfo: JsonConfigFileClass | null;
// };

// let ph = FileClass.getStandardPath("./plugins/LiteLoader/xuiddb/db.json");
// if (ph == null) { throw new Error(`FileClass::GetStandardPath (PlayerInfo) 获取标准路径失败!`); }
// FileClass.mkdir(path.dirname(ph));
// global.PlayerInfo = new JsonConfigFileClass(ph, "{}");
// if (PlayerInfo == null) { throw new Error(`Global::DataClass 玩家数据库状态异常!`); }
// events.packetAfter(MinecraftPacketIds.Login).on((ptr, networkIdentifier, packetId) => {
//     if (ptr.connreq === null) return; // Wrong client version
//     const cert = ptr.connreq.getCertificate();
//     const xuid = cert.getXuid();
//     const username = cert.getId();//realName
//     if (PlayerInfo == null) { throw new Error(`Global::DataClass 玩家数据库状态异常!`); }
//     PlayerInfo.set(xuid, username);
// });

export namespace data {
    export function openConfig(path: string, type: "json" | "ini", de: string) {
        if (type == "json") {
            return new JsonConfigFileClass(path, de);
        } else if (type == "ini") {
            return new IniConfigFileClass(path, de);
        }
    }
    // export function xuid2name(xuid: string) {
    //     if (PlayerInfo == null) { throw new Error(`Global::DsataClass::Xuid2Name 玩家数据库状态异常!`); }
    //     let info: string | null = PlayerInfo.get(xuid);
    //     return (info == null ? "" : info);
    // }
    // export function name2xuid(name: string) {
    //     if (PlayerInfo == null) { throw new Error(`Global::DataClass::Name2Xuid 玩家数据库状态异常!`); }
    //     let tmp = JSON.parse(PlayerInfo.read());
    //     let keys = Object.keys(tmp), values = Object.values(tmp), index = values.indexOf(name);
    //     let info: string = (index == -1 ? "" : keys[index]);
    //     return info;
    // }
}