"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginPackage = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const logger_1 = require("../tools/logger");
const PLUGIN_DIR = "./plugins/";
let allPackage = new Map();
let logger = new logger_1.Logger("PluginLoader");
class PluginPackage {
    constructor(dir, name, desc, version) {
        this.dir = dir;
        this.name = name;
        this.desc = desc;
        this.version = version;
    }
    static LoadAllPackage() {
        return __awaiter(this, void 0, void 0, function* () {
            let dirs = (0, fs_1.readdirSync)(PLUGIN_DIR, { "withFileTypes": true });
            let l = dirs.length, i = 0;
            while (i < l) {
                let dir = dirs[i++];
                if (dir.isDirectory() && (dir.name).toLowerCase() != "data") {
                    let fullDir = PLUGIN_DIR + dir.name;
                    let tmp = this.loadPlugin(fullDir);
                    if (tmp) {
                        logger.info(`加载Node包 [${fullDir}] 成功!`);
                    }
                    else {
                        logger.error(`加载Node包 [${fullDir}] 失败!`);
                    }
                }
            }
        });
    }
    static loadPlugin(dir) {
        try {
            let PackagePath = path_1.default.join(dir, "package.json");
            let packageObj = JSON.parse((0, fs_1.readFileSync)(PackagePath, "utf8"));
            if (packageObj.name != dir.replace(PLUGIN_DIR, "")) {
                throw new Error(`模块名称只能和目录名相同!`);
            }
            let tmp = new PluginPackage(dir, packageObj.name, packageObj.description, packageObj.version);
            tmp.load();
            return tmp;
        }
        catch (e) {
            logger.error(`Error in load plugin: [${dir}]`);
            logger.error(e.stack);
            return undefined;
        }
    }
    _CheckDependencies() {
        let PackagePath = path_1.default.join(this.dir, "package.json");
        let packageObj = JSON.parse((0, fs_1.readFileSync)(PackagePath, "utf8"));
        for (let key in packageObj.dependencies || {}) {
            let ModuleDir = path_1.default.join(this.dir, `node_modules/${key}`);
            try {
                if (!(0, fs_1.statSync)(ModuleDir).isDirectory()) {
                    throw new Error("");
                }
            }
            catch (_e) {
                let e = _e;
                e.message = `Node包 [${this.dir}] 加载失败!原因: 此插件的依赖包 [${key}] 未安装!`;
                throw e;
            }
        }
    }
    load() {
        // console.log();
        this._CheckDependencies();
        try {
            this.Exports = require("./../" + this.dir);
            allPackage.set(this.name, this);
        }
        catch (_e) {
            let e = _e;
            e.message = `Node包 [${this.dir}] 加载失败!\n${e.message}`;
            throw e;
        }
    }
    toJson() {
        return {
            "dir": this.dir,
            "name": this.name,
            "desc": this.desc,
            "version": this.version
        };
    }
}
exports.PluginPackage = PluginPackage;
