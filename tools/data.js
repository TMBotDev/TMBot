"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _JsonConfigFileClass_Path, _JsonConfigFileClass_TextCache, _JsonConfigFileClass_Cache, _JsonConfigFileClass_TimeStamp, _JsonConfigFileClass_isTasking, _JsonConfigFileClass_isDestroy, _IniConfigFileClass_Path, _IniConfigFileClass_TextCache, _IniConfigFileClass_Cache, _IniConfigFileClass_TimeStamp, _IniConfigFileClass_isTasking, _IniConfigFileClass_isDestroy;
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = exports.IniConfigFileClass = exports.JsonConfigFileClass = void 0;
const file_1 = require("./file");
let ini = new class {
    constructor() { }
    ; //空构造函数
    parse(str) {
        if (typeof (str) != "string") {
            throw new Error("The passed parameter must be a string!");
        }
        let lines = str.replace(/\r\n/, "\n").replace(/\r/, "\n").split("\n"), l = lines.length, i = 0, res = {}, nowel = "";
        while (i < l) {
            let lstr = lines[i++].trim(), fh = lstr.indexOf(";");
            if (fh != -1) {
                lstr = lstr.substring(0, fh).trim();
            } //除注去释
            if (lstr[0] == ";") {
                continue;
            } //跳过注释
            if (lstr[0] == "[") {
                let end = lstr.indexOf("]");
                if (end == -1) {
                    throw new Error("No closing statement!");
                }
                let cl = lstr.substring(1, end);
                res[cl] = {};
                nowel = cl;
            }
            else {
                let [key, value] = lstr.split("=", 2);
                if (key != "") {
                    res[nowel][key] = value;
                }
            }
        }
        return res;
    }
    ;
    stringify(obj) {
        if (Object.prototype.toString.call(obj) != '[object Object]') {
            throw new Error("The parameter must be an object!");
        }
        let els = Object.keys(obj), l = els.length, i = 0, nowel = "", strArr = [];
        while (i < l) {
            let el = els[i++];
            if (Object.prototype.toString.call(obj[el]) != '[object Object]') {
                strArr.push(`[${nowel}]`);
                strArr.push(`${el}=${obj[el]}`);
            }
            else {
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
    }
    ;
};
class JsonConfigFileClass {
    constructor(path, defaultStr = "{}") {
        _JsonConfigFileClass_Path.set(this, void 0);
        _JsonConfigFileClass_TextCache.set(this, void 0);
        _JsonConfigFileClass_Cache.set(this, void 0);
        _JsonConfigFileClass_TimeStamp.set(this, void 0);
        _JsonConfigFileClass_isTasking.set(this, void 0);
        _JsonConfigFileClass_isDestroy.set(this, void 0);
        __classPrivateFieldSet(this, _JsonConfigFileClass_Path, path, "f");
        __classPrivateFieldSet(this, _JsonConfigFileClass_TimeStamp, 0, "f");
        let fileText = file_1.FileClass.readFrom(path);
        if (fileText == null) {
            fileText = defaultStr;
            this._saveData(JSON.parse(fileText));
        }
        __classPrivateFieldSet(this, _JsonConfigFileClass_TextCache, fileText, "f");
        __classPrivateFieldSet(this, _JsonConfigFileClass_isTasking, false, "f");
        __classPrivateFieldSet(this, _JsonConfigFileClass_isDestroy, false, "f");
    }
    _getCache() {
        if (__classPrivateFieldGet(this, _JsonConfigFileClass_isDestroy, "f")) {
            throw new Error(`JsonConfigFileClass::_GetCache: Illegal use of destroyed object<${__classPrivateFieldGet(this, _JsonConfigFileClass_Path, "f")}>!`);
        }
        let nowTime = Date.now();
        if ((nowTime - __classPrivateFieldGet(this, _JsonConfigFileClass_TimeStamp, "f")) > 500) {
            __classPrivateFieldSet(this, _JsonConfigFileClass_Cache, JSON.parse(__classPrivateFieldGet(this, _JsonConfigFileClass_TextCache, "f")), "f");
            __classPrivateFieldSet(this, _JsonConfigFileClass_TimeStamp, nowTime, "f");
        }
        return __classPrivateFieldGet(this, _JsonConfigFileClass_Cache, "f");
    }
    _saveData(obj) {
        if (__classPrivateFieldGet(this, _JsonConfigFileClass_isDestroy, "f")) {
            throw new Error(`JsonConfigFileClass::_SaveData: Illegal use of destroyed object<${__classPrivateFieldGet(this, _JsonConfigFileClass_Path, "f")}>!`);
        }
        __classPrivateFieldSet(this, _JsonConfigFileClass_Cache, obj, "f");
        if (!__classPrivateFieldGet(this, _JsonConfigFileClass_isTasking, "f")) {
            __classPrivateFieldSet(this, _JsonConfigFileClass_isTasking, true, "f");
            process.nextTick(() => {
                __classPrivateFieldSet(this, _JsonConfigFileClass_TextCache, JSON.stringify(__classPrivateFieldGet(this, _JsonConfigFileClass_Cache, "f")), "f");
                file_1.FileClass.writeTo(__classPrivateFieldGet(this, _JsonConfigFileClass_Path, "f"), __classPrivateFieldGet(this, _JsonConfigFileClass_TextCache, "f"));
                __classPrivateFieldSet(this, _JsonConfigFileClass_isTasking, false, "f");
            });
        }
        return true;
    }
    init(key, content) {
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
    get(key, defaultStr = null) {
        let cache = this._getCache();
        let res = cache[key];
        return (res === undefined ? defaultStr : res);
    }
    set(key, content) {
        let cache = this._getCache();
        cache[key] = content;
        return this._saveData(cache);
    }
    delete(key) {
        let cache = this._getCache();
        if (cache[key] == undefined) {
            return false;
        }
        delete cache[key];
        return this._saveData(cache);
    }
    reload() {
        if (__classPrivateFieldGet(this, _JsonConfigFileClass_isDestroy, "f")) {
            throw new Error(`JsonConfigFileClass::Reload: Illegal use of destroyed object<${__classPrivateFieldGet(this, _JsonConfigFileClass_Path, "f")}>!`);
        }
        let fileText = file_1.FileClass.readFrom(__classPrivateFieldGet(this, _JsonConfigFileClass_Path, "f"));
        if (fileText == null) {
            throw new Error(`The original file <${__classPrivateFieldGet(this, _JsonConfigFileClass_Path, "f")}> disappeared!`);
        }
        __classPrivateFieldSet(this, _JsonConfigFileClass_TextCache, fileText, "f");
        __classPrivateFieldSet(this, _JsonConfigFileClass_TimeStamp, 0, "f");
        return true;
    }
    close() {
        if (__classPrivateFieldGet(this, _JsonConfigFileClass_isDestroy, "f")) {
            throw new Error(`JsonConfigFileClass::Close: Illegal use of destroyed object<${__classPrivateFieldGet(this, _JsonConfigFileClass_Path, "f")}>!`);
        }
        let cache = this._getCache();
        __classPrivateFieldSet(this, _JsonConfigFileClass_isDestroy, true, "f");
        return this._saveData(cache);
    }
    getPath() {
        if (__classPrivateFieldGet(this, _JsonConfigFileClass_isDestroy, "f")) {
            throw new Error(`JsonConfigFileClass:GetPath: Illegal use of destroyed object<${__classPrivateFieldGet(this, _JsonConfigFileClass_Path, "f")}>!`);
        }
        return __classPrivateFieldGet(this, _JsonConfigFileClass_Path, "f");
    }
    read() {
        if (__classPrivateFieldGet(this, _JsonConfigFileClass_isDestroy, "f")) {
            throw new Error(`JsonConfigFileClass::Read: Illegal use of destroyed object<${__classPrivateFieldGet(this, _JsonConfigFileClass_Path, "f")}>!`);
        }
        return JSON.stringify(this._getCache(), null, 2);
    }
    write(content) {
        if (__classPrivateFieldGet(this, _JsonConfigFileClass_isDestroy, "f")) {
            throw new Error(`JsonConfigFileClass::Write: Illegal use of destroyed object<${__classPrivateFieldGet(this, _JsonConfigFileClass_Path, "f")}>!`);
        }
        __classPrivateFieldSet(this, _JsonConfigFileClass_TextCache, content, "f");
        __classPrivateFieldSet(this, _JsonConfigFileClass_TimeStamp, 0, "f");
        file_1.FileClass.writeTo(__classPrivateFieldGet(this, _JsonConfigFileClass_Path, "f"), content);
        this._getCache();
        return true;
    }
}
exports.JsonConfigFileClass = JsonConfigFileClass;
_JsonConfigFileClass_Path = new WeakMap(), _JsonConfigFileClass_TextCache = new WeakMap(), _JsonConfigFileClass_Cache = new WeakMap(), _JsonConfigFileClass_TimeStamp = new WeakMap(), _JsonConfigFileClass_isTasking = new WeakMap(), _JsonConfigFileClass_isDestroy = new WeakMap();
class IniConfigFileClass {
    constructor(path, defaultStr = "{}") {
        _IniConfigFileClass_Path.set(this, void 0);
        _IniConfigFileClass_TextCache.set(this, void 0);
        _IniConfigFileClass_Cache.set(this, void 0);
        _IniConfigFileClass_TimeStamp.set(this, void 0);
        _IniConfigFileClass_isTasking.set(this, void 0);
        _IniConfigFileClass_isDestroy.set(this, void 0);
        __classPrivateFieldSet(this, _IniConfigFileClass_Path, path, "f");
        __classPrivateFieldSet(this, _IniConfigFileClass_TimeStamp, 0, "f");
        let fileText = file_1.FileClass.readFrom(path);
        if (fileText == null) {
            fileText = defaultStr;
        }
        __classPrivateFieldSet(this, _IniConfigFileClass_TextCache, fileText, "f");
        __classPrivateFieldSet(this, _IniConfigFileClass_isTasking, false, "f");
        __classPrivateFieldSet(this, _IniConfigFileClass_isDestroy, false, "f");
    }
    _getCache() {
        if (__classPrivateFieldGet(this, _IniConfigFileClass_isDestroy, "f")) {
            throw new Error(`IniConfigFileClass::_GetCache: Illegal use of destroyed object<${__classPrivateFieldGet(this, _IniConfigFileClass_Path, "f")}>!`);
        }
        let nowTime = Date.now();
        if ((nowTime - __classPrivateFieldGet(this, _IniConfigFileClass_TimeStamp, "f")) > 500) {
            __classPrivateFieldSet(this, _IniConfigFileClass_Cache, ini.parse(__classPrivateFieldGet(this, _IniConfigFileClass_TextCache, "f")), "f");
            __classPrivateFieldSet(this, _IniConfigFileClass_TimeStamp, nowTime, "f");
        }
        return __classPrivateFieldGet(this, _IniConfigFileClass_Cache, "f");
    }
    _saveData(obj) {
        if (__classPrivateFieldGet(this, _IniConfigFileClass_isDestroy, "f")) {
            throw new Error(`IniConfigFileClass::_SaveData: Illegal use of destroyed object<${__classPrivateFieldGet(this, _IniConfigFileClass_Path, "f")}>!`);
        }
        __classPrivateFieldSet(this, _IniConfigFileClass_Cache, obj, "f");
        if (!__classPrivateFieldGet(this, _IniConfigFileClass_isTasking, "f")) {
            __classPrivateFieldSet(this, _IniConfigFileClass_isTasking, true, "f");
            process.nextTick(() => {
                __classPrivateFieldSet(this, _IniConfigFileClass_TextCache, ini.stringify(__classPrivateFieldGet(this, _IniConfigFileClass_Cache, "f")), "f");
                file_1.FileClass.writeTo(__classPrivateFieldGet(this, _IniConfigFileClass_Path, "f"), __classPrivateFieldGet(this, _IniConfigFileClass_TextCache, "f"));
                __classPrivateFieldSet(this, _IniConfigFileClass_isTasking, false, "f");
            });
        }
        return true;
    }
    init(sec, key, content) {
        let cache = this._getCache();
        let oldData = (cache[sec] == null ? null : cache[sec][key]);
        if (oldData == undefined) {
            let tmp = (cache[sec] || (() => { cache[sec] = {}; return cache[sec]; })());
            tmp[key] = content;
            this._saveData(cache);
        }
        return oldData;
    }
    get(sec, key, defaultStr = null) {
        let cache = this._getCache();
        let tmp = (cache[sec] || (() => { cache[sec] = {}; return cache[sec]; })());
        let res = tmp[key];
        return (res === undefined ? defaultStr : res);
    }
    getStr(sec, key, defaul = "") {
        return this.get(sec, key, defaul);
    }
    getInt(sec, key, defaul = 0) {
        let res = this.get(sec, key, null);
        if (res == null) {
            return defaul;
        }
        else {
            return parseInt(res);
        }
    }
    getFloat(sec, key, defaul = 0.0) {
        let res = this.get(sec, key, null);
        if (res == null) {
            return defaul;
        }
        else {
            return parseFloat(res);
        }
    }
    getBool(sec, key, defaul = false) {
        let res = this.get(sec, key, null);
        if (res == null) {
            return defaul;
        }
        else {
            try {
                return Boolean(JSON.parse(res));
            }
            catch (_) {
                return defaul;
            }
        }
    }
    set(sec, key, content) {
        let cache = this._getCache();
        let tmp = (cache[sec] || (() => { cache[sec] = {}; return cache[sec]; })());
        tmp[key] = content;
        return this._saveData(cache);
    }
    delete(sec, key) {
        let cache = this._getCache();
        if (cache[sec] == null) {
            return false;
        }
        delete cache[sec][key];
        if (Object.keys(cache[sec]).length == 0) {
            delete cache[sec];
        }
        return this._saveData(cache);
    }
    reload() {
        if (__classPrivateFieldGet(this, _IniConfigFileClass_isDestroy, "f")) {
            throw new Error(`IniConfigFileClass::Reload: Illegal use of destroyed object<${__classPrivateFieldGet(this, _IniConfigFileClass_Path, "f")}>!`);
        }
        let fileText = file_1.FileClass.readFrom(__classPrivateFieldGet(this, _IniConfigFileClass_Path, "f"));
        if (fileText == null) {
            throw new Error(`The original file <${__classPrivateFieldGet(this, _IniConfigFileClass_Path, "f")}> disappeared!`);
        }
        __classPrivateFieldSet(this, _IniConfigFileClass_TextCache, fileText, "f");
        __classPrivateFieldSet(this, _IniConfigFileClass_TimeStamp, 0, "f");
        return true;
    }
    close() {
        if (__classPrivateFieldGet(this, _IniConfigFileClass_isDestroy, "f")) {
            throw new Error(`IniConfigFileClass::Close: Illegal use of destroyed object<${__classPrivateFieldGet(this, _IniConfigFileClass_Path, "f")}>!`);
        }
        let cache = this._getCache();
        __classPrivateFieldSet(this, _IniConfigFileClass_isDestroy, true, "f");
        return this._saveData(cache);
    }
    getPath() {
        if (__classPrivateFieldGet(this, _IniConfigFileClass_isDestroy, "f")) {
            throw new Error(`IniConfigFileClass:GetPath: Illegal use of destroyed object<${__classPrivateFieldGet(this, _IniConfigFileClass_Path, "f")}>!`);
        }
        return __classPrivateFieldGet(this, _IniConfigFileClass_Path, "f");
    }
    read() {
        if (__classPrivateFieldGet(this, _IniConfigFileClass_isDestroy, "f")) {
            throw new Error(`IniConfigFileClass::Read: Illegal use of destroyed object<${__classPrivateFieldGet(this, _IniConfigFileClass_Path, "f")}>!`);
        }
        return JSON.stringify(this._getCache(), null, 2);
    }
    write(content) {
        if (__classPrivateFieldGet(this, _IniConfigFileClass_isDestroy, "f")) {
            throw new Error(`IniConfigFileClass::Write: Illegal use of destroyed object<${__classPrivateFieldGet(this, _IniConfigFileClass_Path, "f")}>!`);
        }
        __classPrivateFieldSet(this, _IniConfigFileClass_TextCache, content, "f");
        __classPrivateFieldSet(this, _IniConfigFileClass_TimeStamp, 0, "f");
        file_1.FileClass.writeTo(__classPrivateFieldGet(this, _IniConfigFileClass_Path, "f"), content);
        this._getCache();
        return true;
    }
}
exports.IniConfigFileClass = IniConfigFileClass;
_IniConfigFileClass_Path = new WeakMap(), _IniConfigFileClass_TextCache = new WeakMap(), _IniConfigFileClass_Cache = new WeakMap(), _IniConfigFileClass_TimeStamp = new WeakMap(), _IniConfigFileClass_isTasking = new WeakMap(), _IniConfigFileClass_isDestroy = new WeakMap();
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
var data;
(function (data) {
    function openConfig(path, type, de) {
        if (type == "json") {
            return new JsonConfigFileClass(path, de);
        }
        else if (type == "ini") {
            return new IniConfigFileClass(path, de);
        }
    }
    data.openConfig = openConfig;
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
})(data = exports.data || (exports.data = {}));
