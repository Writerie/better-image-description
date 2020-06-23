const currentURL = new URL(location.href).searchParams.get('currenturl');
const imageErrors = new URL(location.href).searchParams.get('imageErrors');
const imageWarnings = new URL(location.href).searchParams.get('imageWarnings');
const imageData = JSON.parse(new URL(location.href).searchParams.get('imageData'));
const errorElement = document.querySelector('[data-errors]');
const warningElement = document.querySelector('[data-warnings]');
const yeahElement = document.querySelector('[data-yeah]');
const imageCountElement = document.querySelector('[data-image-count]');
const imageListElement = document.querySelector('[data-image-list]');
let hasErrorsOrWarnings = false;

if (imageErrors && imageErrors > 0) {
    errorElement.hidden = false;
    errorElement.querySelector('span').innerText = imageErrors;
    hasErrorsOrWarnings = true;
} else {
    errorElement.hidden = true;
}

if (imageWarnings && imageWarnings > 0) {
    warningElement.hidden = false;
    warningElement.querySelector('span').innerText = imageWarnings;
    hasErrorsOrWarnings = true;
} else {
    warningElement.hidden = true;
}

if (hasErrorsOrWarnings) {
    yeahElement.hidden = true;
} else {
    yeahElement.hidden = false;
}

const imageWithErrors = imageData.filter(function(image) {
    return image.level === "error";
});

const imageWithWarnings = imageData.filter(function(image) {
    return image.level === "warning";
});

const imageNoIssues = imageData.filter(function(image) {
    return image.level === "info";
});

const addImageToList = function(imageData) {
    const li = document.createElement('li');
    const img = document.createElement('img');
    const info = document.createElement('p');
    const altInfo = document.createElement('p');
    img.src = imageData.src
    img.setAttribute = imageData.alt;
    info.innerText = imageData.messageText;
    altInfo.innerText = imageData.alt;
    li.appendChild(info);
    li.appendChild(img);
    li.appendChild(altInfo);
    li.className = 'level-' + imageData.level;
    imageListElement.appendChild(li);
}

if (imageData && imageData.length && imageData.length > 0) {
    imageCountElement.querySelector('strong').innerText = imageData.length;
    if (imageWithErrors && imageWithErrors.length && imageWithErrors.length > 0) {
        imageWithErrors.forEach(function(imageWithError) {
            addImageToList(imageWithError);
        });
    }
    if (imageWithWarnings && imageWithWarnings.length && imageWithWarnings.length > 0) {
        imageWithWarnings.forEach(function(imageWithWarning) {
            addImageToList(imageWithWarning);
        });
    }
    if (imageNoIssues && imageNoIssues.length && imageNoIssues.length > 0) {
        imageNoIssues.forEach(function(imageNoIssue) {
            addImageToList(imageNoIssue);
        });
    }

    imageCountElement.hidden = false;
    imageListElement.hidden = false;
} else {
    imageCountElement.hidden = true;
    imageListElement.hidden = true;
}
let url = currentURL.replace('https://', '').replace('http://', ' ');
if (url.endsWith('/')) {
    url = url.replace(/.$/, "");
}
document.querySelector('[data-currenturl]').innerText = url;