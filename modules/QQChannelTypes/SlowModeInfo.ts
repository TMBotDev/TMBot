
/**
 * 慢速模式信息
 * 
 */
export class SlowModeInfo {
    constructor(private obj: {
        "slow_mode_key": number,	//慢速模式Key
        "slow_mode_text": string,	//慢速模式说明
        "speak_frequency": number,	//周期内发言频率限制
        "slow_mode_circle": number	//单位周期时间, 单位秒
    }) { }
    /** 慢速模式Key */
    get slow_mode_key() { return this.obj.slow_mode_key; }
    /** 慢速模式说明 */
    get slow_mode_text() { return this.obj.slow_mode_text; }
    /** 周期内发言频率限制 */
    get speak_frequency() { return this.obj.speak_frequency; }
    /** 单位周期时间, 单位秒}[]	//频道内可用慢速模式类型列表 */
    get slow_mode_circle() { return this.obj.slow_mode_circle; }

    toString() {
        return `<Class::${this.constructor.name}>\n${JSON.stringify(this.obj, null, 2)}`;
    }
}