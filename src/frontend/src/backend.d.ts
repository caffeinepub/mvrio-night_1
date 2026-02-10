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
export interface MessagesView {
    contactInfo?: ContactInfo;
    messages: Array<Message>;
}
export interface Message {
    id: bigint;
    content: string;
    audioAttachment?: ExternalBlob;
    pdfAttachment?: ExternalBlob;
    isRead: boolean;
    sender: string;
    imageAttachment?: ExternalBlob;
    timestamp: bigint;
    isAdmin: boolean;
    recipientSeen: boolean;
}
export interface UserProfileRecord {
    totalListeningTime: bigint;
    userName: string;
    dateOfBirth: string;
    fullName: string;
}
export interface ContactInfo {
    instagram: string;
    name: string;
    email: string;
    youtube: string;
    phone: string;
}
export interface ArtistProfile {
    bio: string;
    instagram: string;
    buyMeACoffee: string;
    youtube: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addListeningTime(seconds: bigint): Promise<void>;
    addSong(title: string, artist: string, albumArt: ExternalBlob, titleImage: ExternalBlob, audioFile: ExternalBlob, lyrics: string, passcode: string): Promise<bigint>;
    addToOfficialPlaylist(playlistName: string, songId: bigint, passcode: string): Promise<void>;
    addToPlaylist(playlistName: string, songId: bigint): Promise<void>;
    adminDeleteConversation(conversationType: string | null, conversationId: string, passcode: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkAuthorization(): Promise<boolean>;
    clearFavorites(): Promise<void>;
    clearMessages(): Promise<void>;
    createOfficialPlaylist(name: string, passcode: string): Promise<void>;
    createPlaylist(name: string): Promise<void>;
    deleteMessage(messageId: bigint): Promise<void>;
    deletePlaylist(playlistName: string, passcode: string | null): Promise<void>;
    deleteSong(id: bigint, passcode: string): Promise<void>;
    deleteUserMessage(user: Principal, messageId: bigint, passcode: string): Promise<void>;
    getAllConversations(passcode: string): Promise<Array<Principal>>;
    getAllConversationsByUserIdPasscode(passcode: string): Promise<Array<Principal>>;
    getAllMessages(user: Principal, passcode: string): Promise<MessagesView | null>;
    getAllSongs(): Promise<Array<SongView>>;
    getAllSongsByTitle(): Promise<Array<SongView>>;
    getArtistProfile(): Promise<ArtistProfile>;
    getCallerUserProfile(): Promise<UserProfileRecord | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFavorites(): Promise<Array<bigint>>;
    getHiddenAdminModeStatus(passcode: string): Promise<boolean>;
    getMessages(): Promise<MessagesView | null>;
    getOfficialPlaylist(playlistName: string): Promise<PlaylistView | null>;
    getOfficialPlaylistDetails(playlistName: string): Promise<Array<SongView>>;
    getPlaylist(playlistName: string): Promise<PlaylistView>;
    getPlaylistDetails(playlistName: string): Promise<Array<SongView>>;
    getSong(id: bigint): Promise<SongView>;
    getTotalListeningTime(): Promise<bigint>;
    getUnreadMessagesCount(passcode: string): Promise<bigint>;
    getUserPlaylists(): Promise<Array<PlaylistView>>;
    getUserProfile(user: Principal): Promise<UserProfileRecord | null>;
    isCallerAdmin(): Promise<boolean>;
    listOfficialPlaylists(): Promise<Array<PlaylistView>>;
    markAllMessagesAsSeen(senderType: string, user: Principal, passcode: string): Promise<void>;
    markLastMessageAsRead(): Promise<void>;
    markMessagesAsSeen(fileOnly: boolean): Promise<void>;
    playSong(id: bigint): Promise<void>;
    removeFromOfficialPlaylist(playlistName: string, songId: bigint, passcode: string): Promise<void>;
    removeFromPlaylist(playlistName: string, songId: bigint): Promise<void>;
    replyToMessage(user: Principal, content: string, passcode: string): Promise<bigint>;
    replyWithAttachments(user: Principal, content: string, audioAttachment: ExternalBlob | null, imageAttachment: ExternalBlob | null, pdfAttachment: ExternalBlob | null, passcode: string): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfileRecord): Promise<void>;
    searchSongs(keyword: string): Promise<Array<SongView>>;
    sendMessage(content: string): Promise<bigint>;
    sendMessageWithAttachments(content: string, audioAttachment: ExternalBlob | null, imageAttachment: ExternalBlob | null, pdfAttachment: ExternalBlob | null): Promise<bigint>;
    setHiddenAdminMode(enabled: boolean, passcode: string): Promise<void>;
    toggleFavorite(songId: bigint): Promise<boolean>;
    toggleLikeSong(id: bigint): Promise<bigint>;
    updateAdminInfo(contactInfo: ContactInfo | null): Promise<void>;
    updateArtistProfile(profile: ArtistProfile): Promise<void>;
    updateTotalListeningTime(seconds: bigint): Promise<void>;
}
