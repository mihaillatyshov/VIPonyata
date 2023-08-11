import React from "react";

import styles from "./StylesCreatePage.module.css";
import { DictionaryWord } from "./NewWordsModal";

interface WordsTableProps {
    words: DictionaryWord[];
}

const WordsTable = ({ words }: WordsTableProps) => {
    if (words.length === 0) {
        return <></>;
    }

    return (
        <div className={`${styles.newWordsTableContainer}`}>
            <div className={`${styles.newWordsTable} header`}>
                <div className={styles.newWordsTableCell}>Перевод</div>
                <div className={styles.newWordsTableCell}>Слово</div>
                <div className={styles.newWordsTableCell}>Символ</div>
            </div>
            {words.map((item) => (
                <div key={item.ru} className={`${styles.newWordsTable} ${styles.newWordsTableRow}`}>
                    <div className={styles.newWordsTableCell}>{item.ru}</div>
                    <div className={styles.newWordsTableCell}>{item.word_jp}</div>
                    <div className={styles.newWordsTableCell}>{item.char_jp}</div>
                </div>
            ))}
        </div>
    );
};

export default WordsTable;
