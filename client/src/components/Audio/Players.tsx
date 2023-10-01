import React, { useState, useEffect } from "react";

interface TPlayer {
    url: string;
    playing: boolean;
}

const useMultiAudio = (urls: string[]): [TPlayer[], (targetIndex: number) => () => void] => {
    const [sources] = useState(urls.map((url) => ({ url, audio: new Audio(url) })));
    const [players, setPlayers] = useState<TPlayer[]>(urls.map((url) => ({ url, playing: false })));

    const toggle = (targetIndex: number) => () => {
        const newPlayers = [...players];
        const currentIndex = players.findIndex((p) => p.playing === true);
        if (currentIndex !== -1 && currentIndex !== targetIndex) {
            newPlayers[currentIndex].playing = false;
            newPlayers[targetIndex].playing = true;
        } else if (currentIndex !== -1) {
            newPlayers[targetIndex].playing = false;
        } else {
            newPlayers[targetIndex].playing = true;
        }
        setPlayers(newPlayers);
    };

    useEffect(() => {
        sources.forEach((source, i) => {
            players[i].playing ? source.audio.play() : source.audio.pause();
            // source.audio.
        });
    }, [sources, players]);

    useEffect(() => {
        sources.forEach((source, i) => {
            source.audio.addEventListener("ended", () => {
                const newPlayers = [...players];
                newPlayers[i].playing = false;
                setPlayers(newPlayers);
            });
        });
        return () => {
            sources.forEach((source, i) => {
                source.audio.removeEventListener("ended", () => {
                    const newPlayers = [...players];
                    newPlayers[i].playing = false;
                    setPlayers(newPlayers);
                });
            });
        };
    }, []);

    return [players, toggle];
};

const MultiPlayer = ({ urls }: { urls: string[] }) => {
    const [players, toggle] = useMultiAudio(urls);

    return (
        <div>
            {players.map((player, i) => (
                <Player key={i} player={player} toggle={toggle(i)} />
            ))}
        </div>
    );
};

const Player = ({ player, toggle }: { player: TPlayer; toggle: () => void }) => (
    <div>
        <p>Stream URL: {player.url}</p>
        <button onClick={toggle}>{player.playing ? "Pause" : "Play"}</button>
    </div>
);

export default MultiPlayer;
