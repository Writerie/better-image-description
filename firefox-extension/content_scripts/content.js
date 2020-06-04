(function() {

    // only run once
    if (window.hasRun) {
        return;
    }
    window.hasRun = true;

    // img.src should not be equal to image.alt
    function checkIfAltIsSameAsURL(image) {
        if (!image.alt || !image.src) return false;

        if (image.alt !== image.src) return false;

        return true;
    };

    // if img.src contains file extension it is better to double check if this is correct
    function checkIfAltContainsImageExtension(image) {
        if (!image.alt) return false;

        if (!/\.jpg|\.jpeg|\.gif|\.png|\.svg|.\.webp/i.test(image.alt)) return false;

        return true;
    };

    // There is no need to say something like "Image of" as screen reader already announce that it is an image
    function checkIfStartsWithImageWord(image) {
        if (!image.alt) return false;

        const imageAlt = image.alt;
        // TODO: add translations and more variations
        if (!imageAlt.startsWith('Picture of') &&
            !imageAlt.startsWith('Image of') &&
            !imageAlt.startsWith('Image contains') &&
            !imageAlt.startsWith('Picture contains')
        ) {
            return false;
        }
        return true;
    };

    // looking at you twitter, don't do this
    function checkIfOnlyContainsImage(image) {
        if (!image.alt) return false;

        const imageAlt = image.alt.toLowerCase();
        // TODO: add translations
        if (imageAlt !== 'image') return false;

        return true;
    };

    // if description is two characters or less it is most probably not sufficient
    function checkIfAtLeastTwoCharacters(image) {
        if (!image.alt || !image.src) return false;

        if (image.alt.length > 2) return false;

        return true;
    };

    // some sites use the same text for the alt attribute as for the headline of the teaser the image appears in, let's try to catch them
    function checkIfSameAsHeadline(image) {
        const parentLink = image.closest("a");
        const parentArticle = image.closest("article");
        let headline = false;

        if (parentLink) {
            headline = parentLink.querySelector('h2') ? parentLink.querySelector('h2') : parentLink.querySelector('h3') ? parentLink.querySelector('h3') : parentLink.querySelector('h4') ? parentLink.querySelector('h4') : false;
        }

        if (parentArticle) {
            headline = parentArticle.querySelector('h2') ? parentArticle.querySelector('h2') : parentArticle.querySelector('h3') ? parentArticle.querySelector('h3') : parentArticle.querySelector('h4') ? parentArticle.querySelector('h4') : false;
        }

        if (headline) {
            const headlineText = headline.innerText ? headline.innerText.replace(/\s+/g, '') : '';
            const imageAlt = image.alt ? image.alt.replace(/\s+/g, '') : '';
            if (headlineText === imageAlt) {
                return true;
            }
        }

        return false;
    };

    function checkIfUsesAriaToHideAlternativeText(image) {
        if (image.hasAttribute('aria-hidden') || image.getAttribute('aria-role') === 'presentation' || image.getAttribute('aria-role') === 'none') {
            return true;
        }

        return false;
    }

    function checkIfImageHasNoAltAttribute(image) {
        if (!image.hasAttribute('alt')) {
            if (image.hasAttribute('aria-hidden') || image.getAttribute('aria-role') === 'presentation' || image.getAttribute('aria-role') === 'none') {
                return false;
            }
            return true;
        }
        return false;
    }

    function checkIfGraphicalLink(image) {
        var parentIsLink = image.parentNode && image.parentNode.nodeName === 'A' || false;
        var isOnlyChild = image.parentNode && image.parentNode.childElementCount === 1 || false;
        var parentIsPicture = image.parentNode && image.parentNode.nodeName === 'PICTURE' || false;
        if (parentIsPicture) {
            isOnlyChild = image.parentNode.parentNode && image.parentNode.parentNode.childElementCount === 1 || false;
            parentIsLink = image.parentNode.parentNode && image.parentNode.parentNode.nodeName === 'A' || false;
        }

        if (parentIsLink && isOnlyChild) {
            return true;
        }

        return false;
    }


    function unwrap(wrapper) {
        var docFrag = document.createDocumentFragment();
        while (wrapper.firstChild) {
            var child = wrapper.removeChild(wrapper.firstChild);
            docFrag.appendChild(child);
        }

        wrapper.parentNode.replaceChild(docFrag, wrapper);
    };

    function handleDialog(ev) {
        if (ev.target.classList.contains('better-image-description-button')) {

            const bodyHTML = `<div class="better-image-description-main">${document.body.innerHTML}</div>`;
            document.body.innerHTML = DOMPurify.sanitize(bodyHTML);

            const hasDialog = document.getElementById('better-image-description-dialog');

            if (!hasDialog) {

                const dialog = document.createElement('div');
                dialog.id = 'better-image-description-dialog';
                dialog.className = 'better-image-description-dialog';
                dialog.setAttribute('aria-hidden', true);
                const dialogInner = `<div class="dialog-overlay" tabindex="-1" data-a11y-dialog-hide></div>
                <div role="dialog" class="dialog-content" aria-labelledby="dialogTitle">
                  <button data-a11y-dialog-hide class="dialog-close" aria-label="Close this dialog window">&times;</button>
          
                  <h1 id="dialogTitle">Details</h1>
        
                  <div class="better-image-description-dialog-content"></div>
        
                </div>`
                dialog.innerHTML = DOMPurify.sanitize(dialogInner);
                document.body.appendChild(dialog);
            }

            const dialogContent = document.querySelector('.better-image-description-dialog-content');

            dialogContent.innerHTML = DOMPurify.sanitize(ev.target.nextSibling.innerHTML);

            const dialogEl = document.getElementById('better-image-description-dialog');
            const mainEl = document.querySelector('.better-image-description-main');
            if (window.a11yDialog) {
                window.a11yDialog.destroy();
            }

            window.a11yDialog = new window.A11yDialog(dialogEl, mainEl);

            window.a11yDialog.show();

            window.a11yDialog.on('hide', function() {
                const mainWrapper = document.querySelector('.better-image-description-main');
                unwrap(mainWrapper);
            })

        }

        ev.preventDefault();
    }


    // checks all images on the page and collects all errors and warnings found 
    function checkAllImages() {
        const images = document.querySelectorAll('img');
        const currentURL = window.location.href;
        let imageErrors = 0;
        let imageWarnings = 0;
        const imageData = [];

        [].forEach.call(images, function(image) {

            if (image.parentNode.classList.contains('better-image-description-image-wrapper')) return;

            if (image.classList.contains('better-image-description-image-img')) return;

            // ignore images with visual width of less than 5
            if (image.width < 5) return;

            // wrapper for every image, to make it easier to position the other elements we need for the check
            const wrapper = document.createElement('div');
            wrapper.className = 'better-image-description-image-wrapper';
            image.parentNode.insertBefore(wrapper, image);

            // info box contains all the content shown in details view (dialog)
            const infoWrapper = document.createElement('div');
            infoWrapper.className = 'better-image-description-info-wrapper';
            infoWrapper.addEventListener('click', function(ev) {
                ev.preventDefault();
            });

            // duplicate image to show it in dialog
            const infoWrapperImg = document.createElement('img');
            infoWrapperImg.src = image.currentSrc || image.src;
            infoWrapperImg.alt = image.alt;
            infoWrapperImg.className = 'better-image-description-image-img';


            // info about the image description currently in use for an image
            const altInfo = document.createElement('p');
            altInfo.className = 'better-image-description-alt-info';
            if (image.alt) {
                altInfo.innerHTML = DOMPurify.sanitize(`<strong>Description:</strong> ${image.alt}`);
            } else {
                altInfo.innerText = 'Oh no, no description provided!';
            }

            // element for warnings/errors
            const messageWrapper = document.createElement('p');

            // button to trigger dialog
            const infoButton = document.createElement('button');
            infoButton.className = 'better-image-description-button';
            infoButton.innerText = 'Infos';


            // default messages, classes and level
            let messageText = 'Looks fine!';
            let messageClass = 'better-image-description-message better-image-description-message--good';
            let wrapperClass = 'better-image-description-image-wrapper--good';
            let level = 'info';

            if (checkIfGraphicalLink(image)) {
                messageText = 'This seems to be an image link. Please use the alt text to describe for the action that will be initiated (the purpose of the image) and not the image itself.';
                messageClass = 'better-image-description-message better-image-description-message--badish';
                wrapperClass = 'better-image-description-image-wrapper--badish';
                level = 'warning';
                imageWarnings += 1;
            }

            if (checkIfAtLeastTwoCharacters(image)) {
                messageText = 'Please describe the image. Two or less characters are probably not enough.';
                messageClass = 'better-image-description-message better-image-description-message--badish';
                wrapperClass = 'better-image-description-image-wrapper--badish';
                level = 'warning';
                imageWarnings += 1;
            }

            if (checkIfAltContainsImageExtension(image)) {
                messageText = "Please don't use the image name for the image description!";
                messageClass = 'better-image-description-message better-image-description-message--badish';
                wrapperClass = 'better-image-description-image-wrapper--badish';
                level = 'warning';
                imageWarnings += 1;
            }

            if (checkIfStartsWithImageWord(image)) {
                messageText = "Please don't append image of or similar wordings before your image description!";
                messageClass = 'better-image-description-message better-image-description-message--badish';
                wrapperClass = 'better-image-description-image-wrapper--badish';
                level = 'warning';
                imageWarnings += 1;
            }



            if (checkIfSameAsHeadline(image)) {
                messageText = "Please don't use the same text as for the nearby headline";
                messageClass = 'better-image-description-message better-image-description-message--badish';
                wrapperClass = 'better-image-description-image-wrapper--badish';
                level = 'warning';
                imageWarnings += 1;
            }

            if (!image.alt || image.alt === '') {
                messageText = "Please check if this image is really decorative and needs no description!";
                messageClass = 'better-image-description-message better-image-description-message--badish';
                wrapperClass = 'better-image-description-image-wrapper--badish';
                level = 'warning';
                imageWarnings += 1;
            }

            if (checkIfUsesAriaToHideAlternativeText(image)) {
                messageText = "Please check if this image is really decorative and needs no description!";
                messageClass = 'better-image-description-message better-image-description-message--badish';
                wrapperClass = 'better-image-description-image-wrapper--badish';
                level = 'warning';
                imageWarnings += 1;
            }

            if (checkIfOnlyContainsImage(image)) {
                messageText = "Please don't use only the word Image";
                messageClass = 'better-image-description-message better-image-description-message--bad';
                wrapperClass = 'better-image-description-image-wrapper--bad';
                level = 'error';
                imageErrors += 1;
            }

            if (checkIfAltIsSameAsURL(image)) {
                messageText = "Please don't use the image name as the image description!";
                messageClass = 'better-image-description-message better-image-description-message--bad';
                wrapperClass = 'better-image-description-image-wrapper--bad';
                level = 'error';
                imageErrors += 1;
            }


            if (checkIfImageHasNoAltAttribute(image)) {
                messageText = 'Please provide an alt attribute. If the image is decorative it can be empty (alt=""), otherwise please describe the image';
                messageClass = 'better-image-description-message better-image-description-message--bad';
                wrapperClass = 'better-image-description-image-wrapper--bad';
                level = 'error';
                imageErrors += 1;
            }


            // build all elements together
            messageWrapper.className = messageClass;
            messageWrapper.innerText = messageText;

            wrapper.className = wrapper.className + ' ' + wrapperClass;

            infoWrapper.appendChild(infoWrapperImg);
            infoWrapper.appendChild(messageWrapper);
            infoWrapper.appendChild(altInfo);
            wrapper.appendChild(image);
            wrapper.appendChild(infoButton);
            wrapper.appendChild(infoWrapper);

            imageData.push({
                src: image.src,
                alt: image.alt,
                level: level
            });

        });



        document.addEventListener('click', handleDialog);

        // send all infos to the popup
        browser.runtime.sendMessage({
            imageData: imageData,
            imageErrors: imageErrors,
            imageWarnings: imageWarnings,
            currentURL: currentURL
        });
    };

    // remove all checks and dom changes we made when checking all images
    function removeChecks() {
        let wrappers = document.querySelectorAll('.better-image-description-image-wrapper');
        for (let wrapper of wrappers) {
            unwrap(wrapper);
        }
        let buttons = document.querySelectorAll(".better-image-description-button");
        for (let button of buttons) {
            button.remove();
        }
        let infos = document.querySelectorAll(".better-image-description-info-wrapper");
        for (let info of infos) {
            info.remove();
        }
        let dialog = document.querySelector('#better-image-description-dialog');
        if (dialog) {
            dialog.remove();
        }
        document.removeEventListener('click', handleDialog);
    }


    function onScroll() {
        removeChecks();
        checkAllImages();
    }

    // receiving message from popup
    browser.runtime.onMessage.addListener((message) => {
        if (message.command === "check") {
            removeChecks();
            checkAllImages();
            document.removeEventListener('scroll', onScroll, { passive: true });
            document.addEventListener('scroll', onScroll, { passive: true });
        } else if (message.command === "reset") {
            removeChecks();
            document.removeEventListener('scroll', onScroll, { passive: true });
        }
    });

})();