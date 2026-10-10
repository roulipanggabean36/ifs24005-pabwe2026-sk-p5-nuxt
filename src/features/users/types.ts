export interface UserProfile {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  /** URL penuh, path relatif (mis. "img/profile/3_1709251633.png"), atau null */
  photo: string | null
  created_at: string
  updated_at: string
}

export interface UsersData {
  users: UserProfile[]
}

export interface UserData {
  user: UserProfile
}

export interface UpdateProfilePayload {
  name: string
  email: string
}

export interface ChangePasswordPayload {
  password: string
  new_password: string
  new_password_confirmation: string
}
