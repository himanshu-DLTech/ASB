class ContextProvider {
    #textArray = []; #contextLength = 500; #seperator=" ";

    constructor(jsonObj, contextLength, lang) {
        if(lang === "zh" || lang === "chinese") this.#seperator = ""; else this.#seperator = " ";
        this.#textArray = jsonObj.map(element =>  element.text );
        if(contextLength) this.#contextLength  = contextLength;
    }

    getContext(question, wordsArray) {
        return { question, context: wordsArray.join(this.#seperator) };
    }

    getPreviousWords(index , wordsLeft){
        let wordsArray = []; for (let i = index; i >= 0; i--) {
            if(wordsArray.length === wordsLeft) return { preResult: true, preWordsArray:wordsArray};
            const text = this.#textArray[i], words = text.split(this.#seperator);
            if((wordsArray.length + words.length) < wordsLeft) wordsArray.unshift(...words);
            else if((wordsArray.length + words.length) == wordsLeft) return { preResult: true, preWordsArray:wordsArray};
            else {
                const wordsRequired = wordsLeft - wordsArray.length;
                const additionalWords = words.slice(wordsRequired*-1);
                wordsArray.unshift(...additionalWords);
            }
        }
        return { preResult: false, preWordsArray:wordsArray};
    }

    getNextWords(index , wordsLeft){
        let wordsArray = []; for (let i = index; i < this.#textArray.length; i++) {
            if(wordsArray.length === wordsLeft) return wordsArray;
            const text = this.#textArray[i], words = text.split(this.#seperator);
            if((wordsArray.length + words.length) < wordsLeft) { wordsArray.push(...words);}
            else if((wordsArray.length + words.length) == wordsLeft) return wordsArray;
            else {
                const wordsRequired = wordsLeft - wordsArray.length;
                const additionalWords = words.slice(0, wordsRequired);
                wordsArray.push(...additionalWords);
            }
        }
        return wordsArray;
    }

    getInfo(queryNode){
        const currentNodeWordArray = queryNode.split(this.#seperator), wordsCount = currentNodeWordArray.length;
        if(wordsCount >= this.#contextLength) return this.getContext(queryNode, currentNodeWordArray);

        let finalWordsArray = []; finalWordsArray.unshift(...currentNodeWordArray);

        const currentIndex = this.#textArray.indexOf(queryNode);
        let wordsLeft = this.#contextLength - wordsCount;

        const { preResult, preWordsArray } = this.getPreviousWords(currentIndex - 1 , wordsLeft);
        finalWordsArray.unshift(...preWordsArray); if(preResult) return this.getContext(queryNode, finalWordsArray);

        wordsLeft -= preWordsArray.length;
        const nextWordsArray = this.getNextWords(currentIndex + 1 , wordsLeft);
        finalWordsArray.push(...nextWordsArray);

        return this.getContext(queryNode, finalWordsArray);
    }
}

module.exports = ContextProvider;