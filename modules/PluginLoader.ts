import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";
import { FileClass } from "../tools/file";
import { Logger } from "../tools/logger";
import * as child_process from 'child_process';

export const PLUGIN_DIR = "./plugins/";

let allPackage = new Map<string, PluginPackage>();

let logger = new Logger("PluginLoader");

export class PluginPackage {
    static getPackage(name: string) {
        return allPackage.get(name);
    }
    static getPackageKeysIter() {
        return allPackage.keys();
    }
    static async LoadAllPackage() {
        if (!FileClass.exists(PLUGIN_DIR)) {
            logger.info(`插件加载目录不存在!自动创建...`);
            FileClass.mkdir(PLUGIN_DIR);
        }
        let dirs = readdirSync(FileClass.getStandardPath(PLUGIN_DIR)!, { "withFileTypes": true });
        let l = dirs.length, i = 0;
        while (i < l) {
            let dir = dirs[i++];
            if (dir.isDirectory() && (dir.name).toLowerCase() != "data") {
                let fullDir = PLUGIN_DIR + dir.name;
                let tmp = this.loadPlugin(fullDir);
                if (tmp) {
                    logger.info(`加载插件包 [${fullDir}] 成功!`);
                } else {
                    logger.error(`加载插件包 [${fullDir}] 失败!`);
                }
            }
        }
        logger.info(`插件包全部加载完毕!共${allPackage.size}个插件包`);
    }
    static loadPlugin(dir: string) {
        try {
            let PackagePath = path.join(dir, "package.json");
            let packageObj = JSON.parse(readFileSync(FileClass.getStandardPath(PackagePath)!, "utf8"));
            if (packageObj.name != dir.replace(PLUGIN_DIR, "")) {
                throw new Error(`模块名称只能和目录名相同!`);
            }
            let tmp = new PluginPackage(dir, packageObj.name, packageObj.description, packageObj.version);
            tmp.load();
            return tmp;
        } catch (e) {
            // logger.error(`Error in load plugin: [${dir}]`);
            logger.error((e as Error).stack);
            return undefined;
        }
    }

    public Exports: NodeRequire | undefined;
    constructor(
        public dir: string,
        public name: string,
        public desc: string | undefined,
        public version: string | undefined
    ) { }
    _CheckDependencies() {
        let PackagePath = path.join(this.dir, "package.json");
        let packageObj = JSON.parse(readFileSync(FileClass.getStandardPath(PackagePath)!, "utf8"));
        try {
            for (let key in packageObj.dependencies || {}) {
                let ModuleDir = path.join(this.dir, `node_modules/${key}`);
                if (!statSync(FileClass.getStandardPath(ModuleDir)!).isDirectory()) {
                    throw new Error(`插件包 [${this.dir}] 加载失败!原因: 此插件的依赖包 [${key}] 未安装!`);
                }
            }
        } catch (_e) {
            // console.log(this.dir);
            child_process.execSync(
                `cd "${FileClass.getStandardPath(this.dir)}" && npm i`,
                { "stdio": "inherit" }
            );
        }
    }
    load() {
        // console.log();
        this._CheckDependencies();
        try {
            this.Exports = require("./../" + this.dir);
            allPackage.set(this.name, this);
        } catch (_e) {
            let e = _e as Error;
            e.message = `插件包 [${this.dir}] 加载失败!\n${e.name}: ${e.message}`;
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
    // static
}