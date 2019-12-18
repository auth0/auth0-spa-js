let puppeteer = require("puppeteer");

const wait = async (timeout) => new Promise((resolve) => {
    setTimeout(resolve, timeout);
});

describe("Test simple locking", async function() {
    it("Test that locking works when using more than 2 tabs", async function() {
        const domain = "file://" + process.cwd() + "/test/counterTest.html";
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page0 = await browser.newPage();

        // Reset localStorage for testing domain
        await page0.goto(domain, {waitUntil: "load"});
        await page0.evaluate(() => {
            localStorage.setItem("tabs-global-counter", "0");
        });

        // Create multiple tabs and run script in each
        let tabCount = 15;
        let pages = [];
        for (let i = 0; i < tabCount; i++) {
            const page = await browser.newPage();
            await page.goto(domain, { waitUntil: "load" });
            await page.addScriptTag({path: `./bundle/bundle.js`, type: "text/javascript"});
            page.evaluate(() => {
                doTask();
            });
            pages.push(page);
        }

        await wait(20000);

        for(let i = 0; i < pages.length; i++) {
            let page = pages[i];
            await page.evaluate(() => {
                isStopped = true;
            })
        }

        pages.forEach(page => {
            page.evaluate(() => {
                isStopped = true;
            })
        });

        let haveAllStopped = false;

        while(!haveAllStopped) {
            let results = [];

            for (let i = 0; i < pages.length; i++) {
                let page = pages[i];
                let result = await page.evaluate(() => {
                    return hasActuallyStopped;
                });
                results.push(result);
            }

            if (!results.includes(false)) {
                haveAllStopped = true;
            }
        }

        let globalCounter = await page0.evaluate(() => {
            return parseInt(localStorage.getItem("tabs-global-counter"));
        });

        let tabCounterSum = 0;

        for(let i = 0; i < pages.length; i++) {
            let page = pages[i];

            let currentTabCounter = await page.evaluate(() => {
                return tabCounter;
            })

            tabCounterSum += currentTabCounter;
        }

        browser.close()

        if (tabCounterSum !== globalCounter || globalCounter <= 320) {
            throw new Error(`Numbers dont match: \nGlobal counter = ${globalCounter} \n tabCounterSum = ${tabCounterSum}`);
        }
    });


    it("Test that acquiring the same lock on multiple tabs succeeds after the first tab is closed", async function(){
        const domain = "file://" + process.cwd() + "/test/releaseOnClose.html";
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page1 = await browser.newPage();
        await page1.goto(domain, {waitUntil: "load"});
        await page1.addScriptTag({path: `./bundle/bundle.js`, type: "text/javascript"});
        await page1.evaluate(() => {
            doTask()
        })

        await wait(2000);

        let success = await page1.evaluate(() => {
            return didAcquireLock;
        });

        let page2 = await browser.newPage();
        await page2.goto(domain, {waitUntil: "load"});
        await page2.addScriptTag({path: `./bundle/bundle.js`, type: "text/javascript"});
        await page2.evaluate(() => {
            doTask()
        })

        await wait(10000);

        success = await page2.evaluate(() => {
            return didAcquireLock;
        });

        if (success !== false) {
            throw new Error("Acquiring the same lock on a different tab without releasing it succeeded when it should have failed");
        }

        await page2.close();

        await page1.close();

        if (!page1.isClosed()) {
            throw new Error("Page 1 did not close even after calling page.close()")
        }

        page2 = await browser.newPage()
        await page2.goto(domain, {waitUntil: "load"});
        await page2.addScriptTag({path: `./bundle/bundle.js`, type: "text/javascript"});
        await page2.evaluate(() => {
            doTask()
        })

        await wait(10000);

        success = await page2.evaluate(() => {
            return didAcquireLock;
        });

        if (!success) {
            throw new Error("Acquiring lock on page 2 failed even after page 1 closed");
        }

        browser.close();
    });

    it("Test that acquiring the same lock twice from the same tab fails", async function () {
        const domain = "file://" + process.cwd() + "/test/multiLockTest.html";
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();
        await page.goto(domain, {waitUntil: "load"});
        await page.addScriptTag({path: `./bundle/bundle.js`, type: "text/javascript"})
        await page.evaluate(() => {
            doTask();
        })

        await wait(10000);

        let success = await page.evaluate(() => {
            return didAcquireLock;
        });

        if (success) {
            throw new Error("Acquiring the same lock twice in the same tab succeeded");
        }

        await page.evaluate(() => {
            shouldRelease = true;
        });

        await wait(10000);

        success = await page.evaluate(() => {
            return didAcquireLock;
        });

        if (!success) {
            throw new Error("Acquiring lock failed even after first lock released");
        }

        browser.close();
    });

    it("Test that multiple lock instances in the same tab using the same key works as expected", async function() {
        const domain = "file://" + process.cwd() + "/test/singleTabMultiLock.html";
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page0 = await browser.newPage();

        // Reset localStorage for testing domain
        await page0.goto(domain, {waitUntil: "load"});
        await page0.evaluate(() => {
            localStorage.setItem("tabs-global-counter", "0");
        });
        page0.close();

        const page = await browser.newPage();
        await page.goto(domain, {waitUntil: "load"});
        await page.addScriptTag({path: `./bundle/bundle.js`, type: "text/javascript"});
        await page.evaluate(() => {
            start();
        });

        await wait(20000);

        await page.evaluate(() => {
            shouldStop = true;
        });

        let haveAllStopped = false;

        while(!haveAllStopped) {
            let stopValues = await page.evaluate(() => {
                return didStopValues;
            });

            if (!stopValues.includes(false)) {
                haveAllStopped = true;
            }
        }

        let globalCounter = await page.evaluate(() => {
            return parseInt(localStorage.getItem("tabs-global-counter"));
        });

        let localCounterValues = await page.evaluate(() => {
            return localCounterValues;
        });

        let localCounterSum = 0;

        for(let i = 0; i < localCounterValues.length; i++) {
            localCounterSum += localCounterValues[i];
        }

        browser.close()

        if (localCounterSum !== globalCounter || globalCounter <= 300) {
            throw new Error(`Numbers dont match: \nGlobal counter = ${globalCounter} \n localCounterSum = ${localCounterSum}`);
        }
    });
});