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
    description: string;
    songIds: Array<bigint>;
    titleImage?: ExternalBlob;
}
export interface MessagesView {
    contactInfo?: ContactInfo;
    messages: Array<Message>;
}
export interface Message {
    id: bigint;
    content: string;
    audioAttachment?: Attachment;
    pdfAttachment?: Attachment;
    isRead: boolean;
    sender: string;
    imageAttachment?: Attachment;
    fileAttachment?: Attachment;
    timestamp: bigint;
    isAdmin: boolean;
    recipientSeen: boolean;
}
export interface Attachment {
    blob: ExternalBlob;
    mimeType: string;
    fileName: string;
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
    clearUniversalHomeBanner(): Promise<void>;
    createOfficialPlaylist(name: string, description: string, titleImage: ExternalBlob | null, passcode: string): Promise<void>;
    createPlaylist(name: string, description: string, titleImage: ExternalBlob | null): Promise<void>;
    deleteMessage(messageId: bigint): Promise<void>;
    deletePlaylist(playlistName: string, passcode: string | null): Promise<void>;
    deleteSong(id: bigint, passcode: string): Promise<void>;
    deleteUserMessage(user: Principal, messageId: bigint, passcode: string): Promise<void>;
    editOfficialPlaylist(playlistName: string, newName: string, newDescription: string, newTitleImage: ExternalBlob | null, passcode: string): Promise<void>;
    editPlaylist(playlistName: string, newName: string, newDescription: string, newTitleImage: ExternalBlob | null): Promise<void>;
    getAllConversations(passcode: string): Promise<Array<Principal>>;
    getAllConversationsByUserIdPasscode(passcode: string): Promise<Array<Principal>>;
    getAllMessages(user: Principal, passcode: string): Promise<MessagesView | null>;
    getAllSongs(): Promise<Array<SongView>>;
    getAllSongsByTitle(): Promise<Array<SongView>>;
    getArtistProfile(): Promise<ArtistProfile>;
    getCallerUserProfile(): Promise<UserProfileRecord | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDefaultBannerPath(): Promise<string>;
    getFavorites(): Promise<Array<bigint>>;
    getHiddenAdminModeStatus(passcode: string): Promise<boolean>;
    getMessages(): Promise<MessagesView | null>;
    getOfficialPlaylist(playlistName: string): Promise<PlaylistView | null>;
    getOfficialPlaylistDetails(playlistName: string): Promise<Array<SongView>>;
    getPlaylist(playlistName: string): Promise<PlaylistView>;
    getPlaylistDetails(playlistName: string): Promise<Array<SongView>>;
    getPlaylistFavorites(): Promise<Array<string>>;
    getPlaylistFavoritesLegacy(): Promise<Array<string>>;
    getSong(id: bigint): Promise<SongView>;
    getTotalListeningTime(): Promise<bigint>;
    getUniversalHomeBanner(): Promise<ExternalBlob | null>;
    getUnreadMessagesCount(passcode: string): Promise<bigint>;
    getUserPlaylists(): Promise<Array<PlaylistView>>;
    getUserProfile(user: Principal): Promise<UserProfileRecord | null>;
    isCallerAdmin(): Promise<boolean>;
    isPlaylistFavorite(playlistName: string): Promise<boolean>;
    listOfficialPlaylists(): Promise<Array<PlaylistView>>;
    markAllMessagesAsSeen(senderType: string, user: Principal, passcode: string): Promise<void>;
    markLastMessageAsRead(): Promise<void>;
    markMessagesAsSeen(fileOnly: boolean): Promise<void>;
    playSong(id: bigint): Promise<void>;
    playlistFavoritesLegacy(): Promise<Array<string> | null>;
    removeFromOfficialPlaylist(playlistName: string, songId: bigint, passcode: string): Promise<void>;
    removeFromPlaylist(playlistName: string, songId: bigint): Promise<void>;
    reorderOfficialPlaylist(playlistName: string, newOrder: Array<bigint>, passcode: string): Promise<void>;
    reorderPlaylist(playlistName: string, newOrder: Array<bigint>): Promise<void>;
    replyToMessage(user: Principal, content: string, passcode: string): Promise<bigint>;
    replyWithAttachments(user: Principal, content: string, audioAttachment: Attachment | null, imageAttachment: Attachment | null, pdfAttachment: Attachment | null, fileAttachment: Attachment | null, passcode: string): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfileRecord): Promise<void>;
    searchSongs(keyword: string): Promise<Array<SongView>>;
    sendMessage(content: string): Promise<bigint>;
    sendMessageWithAttachments(content: string, audioAttachment: Attachment | null, imageAttachment: Attachment | null, pdfAttachment: Attachment | null, fileAttachment: Attachment | null): Promise<bigint>;
    setHiddenAdminMode(enabled: boolean, passcode: string): Promise<void>;
    setUniversalHomeBanner(blob: ExternalBlob): Promise<void>;
    setUniversalHomeBannerFromURL(_url: string): Promise<void>;
    toggleFavorite(songId: bigint): Promise<boolean>;
    toggleLikeSong(id: bigint): Promise<bigint>;
    togglePlaylistFavorite(playlistName: string): Promise<boolean>;
    updateAdminInfo(contactInfo: ContactInfo | null, passcode: string): Promise<void>;
    updateArtistProfile(profile: ArtistProfile, passcode: string): Promise<void>;
    updateOfficialPlaylist(oldName: string, newName: string, description: string, titleImage: ExternalBlob | null, passcode: string): Promise<void>;
    updatePlaylist(oldName: string, newName: string, description: string, titleImage: ExternalBlob | null): Promise<void>;
    updateTotalListeningTime(seconds: bigint): Promise<void>;
    verifyAdminPasscodeForHiddenAdminMode(passcode: string): Promise<void>;
}
