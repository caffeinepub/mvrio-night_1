import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface SongView {
    id: bigint;
    albumArt: ExternalBlob;
    title: string;
    lyrics: string;
    owner: Principal;
    audioFile: ExternalBlob;
    playCount: bigint;
    artist: string;
    likesCount: bigint;
    titleImage: ExternalBlob;
}
export interface PlaylistView {
    name: string;
    songIds: Array<bigint>;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addSong(title: string, artist: string, albumArt: ExternalBlob, titleImage: ExternalBlob, audioFile: ExternalBlob, lyrics: string): Promise<bigint>;
    addToOfficialPlaylist(playlistName: string, songId: bigint): Promise<void>;
    addToPlaylist(playlistName: string, songId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearFavorites(): Promise<void>;
    createOfficialPlaylist(name: string): Promise<void>;
    createPlaylist(name: string): Promise<void>;
    deleteSong(id: bigint): Promise<void>;
    getAllSongs(): Promise<Array<SongView>>;
    getAllSongsByTitle(): Promise<Array<SongView>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFavorites(): Promise<Array<bigint>>;
    getOfficialPlaylist(playlistName: string): Promise<PlaylistView | null>;
    getOfficialPlaylistDetails(playlistName: string): Promise<Array<SongView>>;
    getPlaylist(playlistName: string): Promise<PlaylistView>;
    getPlaylistDetails(playlistName: string): Promise<Array<SongView>>;
    getSong(id: bigint): Promise<SongView>;
    getUserPlaylists(): Promise<Array<PlaylistView>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    playSong(id: bigint): Promise<void>;
    removeFromOfficialPlaylist(playlistName: string, songId: bigint): Promise<void>;
    removeFromPlaylist(playlistName: string, songId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchSongs(keyword: string): Promise<Array<SongView>>;
    toggleFavorite(songId: bigint): Promise<boolean>;
    toggleLikeSong(id: bigint): Promise<bigint>;
}
