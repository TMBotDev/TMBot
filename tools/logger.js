"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
var _Logger_Title, _Logger_isSyncOutput, _Logger_Config, _Logger_UsePlayer, _Logger_LogOp;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LoggerLevel = void 0;
const process = __importStar(require("process"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const file_1 = require("./file");
// import { ServerPlayer } from "bdsx/bds/player";
// import { bedrockServer } from "bdsx/launcher";
// import { TextPacket } from "bdsx/bds/packets";
let Colors = {
    "§0": "\x1b[38;2;000;000;000m",
    "§1": "\x1b[38;2;000;000;170m",
    "§2": "\x1b[38;2;000;170;000m",
    "§3": "\x1b[38;2;000;170;170m",
    "§4": "\x1b[38;2;170;000;000m",
    "§5": "\x1b[38;2;170;000;170m",
    "§6": "\x1b[38;2;255;170;000m",
    "§7": "\x1b[38;2;170;170;170m",
    "§8": "\x1b[38;2;085;085;085m",
    "§9": "\x1b[38;2;085;085;255m",
    "§a": "\x1b[38;2;085;255;085m",
    "§b": "\x1b[38;2;085;255;255m",
    "§c": "\x1b[38;2;255;085;085m",
    "§d": "\x1b[38;2;255;085;255m",
    "§e": "\x1b[38;2;255;255;085m",
    "§f": "\x1b[38;2;255;255;255m",
    "§g": "\x1b[38;2;221;214;005m",
    "§l": "\x1b[1m",
    "§o": "\x1b[3m",
    "§k": "",
    "§r": "\x1b[0m",
    "§": "", //ESCAPE
};
function getColor(...args) {
    return "\u001b[" + args.join(";") + "m";
}
function AutoReplace(OriText, ...args) {
    while (args.length != 0) {
        let thisArg = args.shift();
        if (thisArg != undefined) {
            OriText = OriText.replace("{}", thisArg);
        }
    }
    return OriText;
}
function DateToString(date) {
    let toFull = (val) => {
        if (val > 9) {
            return val.toString();
        }
        else {
            return `0${val.toString()}`;
        }
    };
    return AutoReplace("{}-{}-{} {}:{}:{}", date.getFullYear().toString(), toFull(date.getMonth() + 1), toFull(date.getDate()), toFull(date.getHours()), toFull(date.getMinutes()), toFull(date.getSeconds()));
}
function mkdirSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    }
    else {
        if (mkdirSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
        }
        else {
            fs.mkdirSync(path.dirname(dirname));
        }
        return true;
    }
}
var LoggerLevel;
(function (LoggerLevel) {
    LoggerLevel[LoggerLevel["Slient"] = 0] = "Slient";
    LoggerLevel[LoggerLevel["Fatal"] = 1] = "Fatal";
    LoggerLevel[LoggerLevel["Error"] = 2] = "Error";
    LoggerLevel[LoggerLevel["Warn"] = 3] = "Warn";
    LoggerLevel[LoggerLevel["Info"] = 4] = "Info";
    LoggerLevel[LoggerLevel["Debug"] = 5] = "Debug";
})(LoggerLevel = exports.LoggerLevel || (exports.LoggerLevel = {}));
function ReplaceDate(str) {
    let date = new Date();
    let toFull = (val) => {
        if (val > 9) {
            return val.toString();
        }
        else {
            return `0${val.toString()}`;
        }
    };
    let MAP = {
        "{Y}": date.getFullYear() + "",
        "{M}": toFull(date.getMonth() + 1) + "",
        "{D}": toFull(date.getDate()) + ""
    };
    let keys = Object.keys(MAP), i = 0, l = keys.length;
    while (i < l) {
        let key = keys[i++];
        while (str.includes(key)) {
            str = str.replace(key, MAP[key]);
        }
    }
    return str;
}
class Logger {
    constructor(title = "", level = 4, isSyncOutput = true) {
        _Logger_Title.set(this, void 0);
        _Logger_isSyncOutput.set(this, void 0);
        _Logger_Config.set(this, void 0);
        _Logger_UsePlayer.set(this, true);
        _Logger_LogOp.set(this, void 0);
        __classPrivateFieldSet(this, _Logger_Title, "", "f");
        this.setTitle(title);
        __classPrivateFieldSet(this, _Logger_isSyncOutput, isSyncOutput, "f");
        __classPrivateFieldSet(this, _Logger_Config, { "Console": { "Enable": true, "level": level }, "File": { "path": "", "level": level }, "Player": null }, "f");
        if (__classPrivateFieldGet(this, _Logger_UsePlayer, "f")) {
            __classPrivateFieldGet(this, _Logger_Config, "f").Player = { "level": level, "xuid": "" };
        }
        __classPrivateFieldGet(this, _Logger_Config, "f").Console = { "level": level, "Enable": true };
        __classPrivateFieldGet(this, _Logger_Config, "f").File = { "level": level, "path": "" };
        __classPrivateFieldSet(this, _Logger_LogOp, (type, text) => {
            var NowDateStr = DateToString(new Date());
            var color = "38;2;255;255;255";
            var plColor = "";
            var typeStr = "";
            switch (type) {
                case LoggerLevel.Slient:
                    typeStr = "Slient";
                    return; //不可能
                case LoggerLevel.Fatal:
                    typeStr = "FATAL";
                    color = "38;2;255;0;0";
                    plColor = "§4";
                    break;
                case LoggerLevel.Error:
                    typeStr = "ERROR";
                    color = "38;2;239;46;46";
                    plColor = "§c";
                    break;
                case LoggerLevel.Warn:
                    typeStr = "WARN";
                    color = "38;2;255;255;0";
                    plColor = "§e";
                    break;
                case LoggerLevel.Info:
                    typeStr = "INFO";
                    color = "38;2;255;255;255";
                    plColor = "§f";
                    break;
                case LoggerLevel.Debug:
                    typeStr = "DEBUG";
                    color = "1;38;2;0;255;255";
                    plColor = "§o";
                    break;
            }
            var NoColorLogStr = AutoReplace("[{} {}] {} {}", NowDateStr, typeStr, (__classPrivateFieldGet(this, _Logger_Title, "f") == "" ? "" : AutoReplace("[{}]", __classPrivateFieldGet(this, _Logger_Title, "f"))), text);
            var ColorLogStr = AutoReplace("{}{} {}{} {}{} {}{}", getColor("38", "2", "173", "216", "230"), //TimeColor
            NowDateStr.split(" ")[1], //Time
            getColor((type == LoggerLevel.Info ? "38;2;0;170;170" : color)), //TypeColor
            typeStr, //Type
            getColor(color), //Msg Color
            (__classPrivateFieldGet(this, _Logger_Title, "f") != "" ? `[${__classPrivateFieldGet(this, _Logger_Title, "f")}]` : ""), //Title
            text, //Msg
            getColor("0") //Clear
            );
            var OutputConsoleFunc = () => {
                if (type <= __classPrivateFieldGet(this, _Logger_Config, "f").Console.level) {
                    let consoleLog = ColorLogStr;
                    let keys = Object.keys(Colors), l = keys.length, i = 0;
                    while (i < l) {
                        let nowKey = keys[i];
                        let nowVal = Colors[nowKey];
                        while (consoleLog.indexOf(nowKey) != -1) {
                            consoleLog = consoleLog.replace(nowKey, nowVal);
                        }
                        i++;
                    }
                    console.log(consoleLog);
                }
            };
            if (__classPrivateFieldGet(this, _Logger_isSyncOutput, "f")) {
                OutputConsoleFunc();
            }
            else {
                process.nextTick(OutputConsoleFunc);
            }
            if (__classPrivateFieldGet(this, _Logger_Config, "f").File.path != "" && type <= __classPrivateFieldGet(this, _Logger_Config, "f").File.level) {
                let dirName = path.dirname(__classPrivateFieldGet(this, _Logger_Config, "f").File.path);
                mkdirSync(dirName);
                fs.appendFileSync(dirName + ReplaceDate(__classPrivateFieldGet(this, _Logger_Config, "f").File.path.replace(dirName, "")), NoColorLogStr + "\n");
            }
            if (__classPrivateFieldGet(this, _Logger_UsePlayer, "f")) {
                // if (this.#Config.Player != null) {
                //     if (this.#Config.Player.xuid != "" && type <= this.#Config.Player.level) {
                //         let sp = bedrockServer.level.getPlayerByXuid(this.#Config.Player.xuid);
                //         if (sp != null) {
                //             let pkt = TextPacket.allocate();
                //             pkt.type = TextPacket.Types.Raw;
                //             pkt.message = plColor + NoColorLogStr;
                //             sp.sendPacket(pkt);
                //             pkt.destruct();
                //         } else { this.#Config.Player.xuid = ""; }
                //     }
                // }
            }
        }, "f");
    }
    ;
    setTitle(title = "") {
        __classPrivateFieldSet(this, _Logger_Title, title, "f");
        return true;
    }
    ;
    setLogLevel(level = 4) {
        if (__classPrivateFieldGet(this, _Logger_UsePlayer, "f")) {
            if (__classPrivateFieldGet(this, _Logger_Config, "f").Player != null) {
                __classPrivateFieldGet(this, _Logger_Config, "f").Player.level = level;
            }
        }
        __classPrivateFieldGet(this, _Logger_Config, "f").Console.level = level;
        __classPrivateFieldGet(this, _Logger_Config, "f").File.level = level;
        return true;
    }
    ;
    setConsole(enable, level = 4) {
        __classPrivateFieldGet(this, _Logger_Config, "f").Console.Enable = enable;
        __classPrivateFieldGet(this, _Logger_Config, "f").Console.level = level;
        return true;
    }
    ;
    setFile(path, level = 4) {
        __classPrivateFieldGet(this, _Logger_Config, "f").File.path = file_1.FileClass.getStandardPath(path);
        __classPrivateFieldGet(this, _Logger_Config, "f").File.level = level;
        return true;
    }
    ;
    // setPlayer(pl: ServerPlayer, level: number = 4): boolean {
    //     if (pl == null) {
    //         return false;
    //     }
    //     if (this.#Config.Player == null) { return false; }
    //     this.#Config.Player.xuid = pl.getXuid();
    //     this.#Config.Player.level = level;
    //     return true;
    // };
    log(...args) {
        __classPrivateFieldGet(this, _Logger_LogOp, "f").call(this, LoggerLevel.Info, args.join(""));
        return true;
    }
    ;
    info(...args) {
        __classPrivateFieldGet(this, _Logger_LogOp, "f").call(this, LoggerLevel.Info, args.join(""));
        return true;
    }
    ;
    debug(...args) {
        __classPrivateFieldGet(this, _Logger_LogOp, "f").call(this, LoggerLevel.Debug, args.join(""));
        return true;
    }
    ;
    warn(...args) {
        __classPrivateFieldGet(this, _Logger_LogOp, "f").call(this, LoggerLevel.Warn, args.join(""));
        return true;
    }
    ;
    error(...args) {
        __classPrivateFieldGet(this, _Logger_LogOp, "f").call(this, LoggerLevel.Error, args.join(""));
        return true;
    }
    ;
    fatal(...args) {
        __classPrivateFieldGet(this, _Logger_LogOp, "f").call(this, LoggerLevel.Fatal, args.join(""));
        return true;
    }
    ;
}
exports.Logger = Logger;
_Logger_Title = new WeakMap(), _Logger_isSyncOutput = new WeakMap(), _Logger_Config = new WeakMap(), _Logger_UsePlayer = new WeakMap(), _Logger_LogOp = new WeakMap();
