type RecordLike = Record<string, unknown>;

const toRecord = (value: unknown): RecordLike =>
  value && typeof value === "object" ? (value as RecordLike) : {};

const readBoolean = (value: RecordLike, keys: string[]) => {
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === "boolean") {
      return candidate;
    }
  }
  return false;
};

export const normalizeFollowStatus = <T>(value: T) => {
  const source = toRecord(value);
  const isFollowing = readBoolean(source, ["isFollowing", "following"]);
  const isFollowedBy = readBoolean(source, [
    "isFollower",
    "follower",
    "isFollowedBy",
    "followedBy",
  ]);
  const isMutualFollow = readBoolean(source, [
    "isFollow",
    "follow",
    "isMutualFollow",
    "mutualFollow",
  ]);

  return {
    ...(source as T & RecordLike),
    isFollowing,
    isFollowedBy,
    isMutualFollow,
  };
};

export const normalizeAuthorFollowStatus = <T>(value: T) => {
  const source = toRecord(value);
  const isFollowingAuthor = readBoolean(source, [
    "isFollowing",
    "following",
    "isFollowingAuthor",
    "followingAuthor",
  ]);
  const isFollowedByAuthor = readBoolean(source, [
    "isFollower",
    "follower",
    "isFollowedByAuthor",
    "followedByAuthor",
  ]);
  const isMutualFollow = readBoolean(source, [
    "isFollow",
    "follow",
    "isMutualFollow",
    "mutualFollow",
  ]);

  return {
    ...(source as T & RecordLike),
    isFollowingAuthor,
    isFollowedByAuthor,
    isMutualFollow,
  };
};
