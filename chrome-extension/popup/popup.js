function checks() {

    function check(tabs) {
        const checkButton = document.querySelector('[data-check]');
        const resetButton = document.querySelector('[data-reset]');
        checkButton.hidden = true;
        resetButton.hidden = false;
        chrome.tabs.sendMessage(tabs[0].id, {
            command: "check"
        });
    }

    function reset(tabs) {
        hideErrorsAndWarnings();
        chrome.tabs.sendMessage(tabs[0].id, {
            command: "reset",
        });
        /*
        chrome.tabs.removeCSS({ file: "/content_scripts/content.css" }), () => {

        }; */
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
            chrome.tabs.query({ active: true }, (tabs) => check(tabs));
        } else if (e.target.classList.contains("reset")) {
            chrome.tabs.query({ active: true }, (tabs) => reset(tabs));
        } else if (e.target.classList.contains("report")) {
            function getReport(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    command: "report"
                });
            }
            chrome.tabs.query({ active: true }, (tabs) => getReport(tabs));

            e.preventDefault();
        }
    });

    // run check when opening the popup
    chrome.tabs.query({ active: true }, (tabs) => check(tabs));
}


function reportExecuteScriptError(error) {
    console.error(`Failed to execute content script: ${error.message}`);
}

chrome.tabs.executeScript({ file: "/content_scripts/a11y-dialog.js" })
chrome.tabs.executeScript({ file: "/content_scripts/purify.min.js" })
chrome.tabs.executeScript({ file: "/content_scripts/content.js" }, () => checks())


// show warnings and errors in popup
function showErrorsAndWarnings(request, sender, sendResponse) {
    if (request.report === true) {
        const popupURL = chrome.extension.getURL(`popup/report.html?currenturl=${request.currentURL}&imageErrors=${request.imageErrors}&imageWarnings=${request.imageWarnings}&imageData=${JSON.stringify(request.imageData)}`);

        chrome.windows.create({
            url: popupURL,
            focused: true
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

chrome.runtime.onMessage.addListener(showErrorsAndWarnings);