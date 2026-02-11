export interface MediaTag {
  id: string
  tag: string
  normalized: string
}

export interface MediaItemTag {
  hashtag: MediaTag
}

export interface AddMediaTagsPayload {
  mediaItemId: string
  tags: string[]
}

export interface RemoveMediaTagPayload {
  mediaItemId: string
  tag: string
}
