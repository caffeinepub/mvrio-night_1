import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Set "mo:core/Set";

module {
  type OldPlaylist = {
    name : Text;
    songs : Set.Set<Nat>;
  };

  type OldActor = {
    officialPlaylists : Map.Map<Text, OldPlaylist>;
  };

  type NewPlaylist = {
    name : Text;
    songs : Set.Set<Nat>;
  };

  type NewActor = {
    officialPlaylists : Map.Map<Text, NewPlaylist>;
  };

  public func run(old : OldActor) : NewActor {
    let newOfficialPlaylists = old.officialPlaylists.map<Text, OldPlaylist, NewPlaylist>(
      func(name, oldPlaylist) { oldPlaylist }
    );
    { officialPlaylists = newOfficialPlaylists };
  };
};
