function checks() {

    function check(tabs) {

        browser.tabs.insertCSS({ file: "/content_scripts/content.css" }).then(() => {
            const checkButton = document.querySelector('[data-check]');
            const resetButton = document.querySelector('[data-reset]');
            checkButton.hidden = true;
            resetButton.hidden = false;
            browser.tabs.sendMessage(tabs[0].id, {
                command: "check"
            });
        });
    }

    function reset(tabs) {
        browser.tabs.removeCSS({ file: "/content_scripts/content.css" }).then(() => {
            hideErrorsAndWarnings();
            browser.tabs.sendMessage(tabs[0].id, {
                command: "reset",
            });
        });
    }


    function reportError(error) {
        console.error(`Error: ${error}`);
    }

    /**
     * Listen for clicks on the buttons, and send the appropriate message to
     * the content script in the page.
     */

    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("check")) {
            browser.tabs.query({ active: true, currentWindow: true })
                .then(check)
                .catch(reportError);
        } else if (e.target.classList.contains("reset")) {
            browser.tabs.query({ active: true, currentWindow: true })
                .then(reset)
                .catch(reportError);
        } else if (e.target.classList.contains("report")) {
            function getReport(tabs) {
                browser.tabs.sendMessage(tabs[0].id, {
                    command: "report"
                });
            }
            browser.tabs.query({ active: true, currentWindow: true })
                .then(getReport)
                .catch(reportError);


            e.preventDefault();
        }
    });

    // run check when opening the popup
    browser.tabs.query({ active: true, currentWindow: true })
        .then(check)
        .catch(reportError);
}


function reportExecuteScriptError(error) {
    console.error(`Failed to execute content script: ${error.message}`);
}

browser.tabs.executeScript({ file: "/content_scripts/a11y-dialog.js" })
browser.tabs.executeScript({ file: "/content_scripts/purify.min.js" })
browser.tabs.executeScript({ file: "/content_scripts/content.js" })
    .then(checks)
    .catch(reportExecuteScriptError);


// show warnings and errors in popup
function showErrorsAndWarnings(request, sender, sendResponse) {

    if (request.report === true) {
        const popupURL = browser.extension.getURL(`popup/report.html?currenturl=${request.currentURL}&imageErrors=${request.imageErrors}&imageWarnings=${request.imageWarnings}&imageData=${JSON.stringify(request.imageData)}`);

        browser.windows.create({
            url: popupURL
        });
    } else {
        const errorElement = document.querySelector('[data-errors]');
        const warningElement = document.querySelector('[data-warnings]');
        const yeahElement = document.querySelector('[data-yeah]');
        const imageCountElement = document.querySelector('[data-image-count]');
        let hasErrorsOrWarnings = false;

        if (request && request.imageErrors && request.imageErrors > 0) {
            errorElement.hidden = false;
            errorElement.querySelector('span').innerText = request.imageErrors;
            hasErrorsOrWarnings = true;
        } else {
            errorElement.hidden = true;
        }

        if (request && request.imageWarnings && request.imageWarnings > 0) {
            warningElement.hidden = false;
            warningElement.querySelector('span').innerText = request.imageWarnings;
            hasErrorsOrWarnings = true;
        } else {
            warningElement.hidden = true;
        }

        if (hasErrorsOrWarnings) {
            yeahElement.hidden = true;
        } else {
            yeahElement.hidden = false;
        }

        if (request && request.imageData && request.imageData.length && request.imageData.length > 0) {
            imageCountElement.querySelector('span').innerText = request.imageData.length;
            imageCountElement.hidden = false;
        } else {
            imageCountElement.hidden = true;
        }
    }


}

function hideErrorsAndWarnings() {
    const errorElement = document.querySelector('[data-errors]');
    const warningElement = document.querySelector('[data-warnings]');
    const yeahElement = document.querySelector('[data-yeah]');
    const imageCountElement = document.querySelector('[data-image-count]');
    const checkButton = document.querySelector('[data-check]');
    const resetButton = document.querySelector('[data-reset]');

    errorElement.hidden = true;
    warningElement.hidden = true;
    yeahElement.hidden = true;
    imageCountElement.hidden = true;

    checkButton.hidden = false;
    resetButton.hidden = true;
}

browser.runtime.onMessage.addListener(showErrorsAndWarnings);