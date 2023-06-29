

export class OffsetException extends Error {
    /**
     * @param _offsetLine 错误行偏移,用于锁定错误地点
     */
    constructor(private _offsetLine: number, msg: string, opt?: ErrorOptions | undefined) {
        super(msg, opt);
    }
    /** 偏移到的错误行 */
    get offsetLine() {
        return this._offsetLine;
    }
}