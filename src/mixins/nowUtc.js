const nowUtc = {
    methods: {
        nowUtc() {
            const nowLoc = new Date();
            const diff = nowLoc.getTimezoneOffset() * 60 * 1000;
            const now = (nowLoc.valueOf() + diff) / 1000;
            return now;
        }
    }
}

export default nowUtc