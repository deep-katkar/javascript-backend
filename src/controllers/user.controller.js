import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, check if avatar has been uploadaed successfully or not because its required field
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creationn
  // if user created return response

  // step 1: getting user details from frontend

  const { fullName, username, email, password } = req.body;
  //   console.log(`email: ${email} username: ${username}`);

  // step 2: validation - if fields are empty not

  //   if (fullName === "") {
  //     throw new ApiError(400, "Fullname is required");
  //   }

  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // step 3: checking if user already exists: using username, email

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with username or email already exists");
  }

  // step 4: checking for images

  //   console.log("\n req.files: ", req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  //   console.log("\n avatarLocalPath:", avatarLocalPath);
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // check for avatar
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // step 5: uploading them to cloudinary

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // check if avatar has been uploadaed successfully or not

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  // step 6: create user object - create entry in db

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    email,
    password,
  });

  // removing password and refresh token field from response

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // checking if user is created or not

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registaring the User");
  }

  // step 7: if user created returning response

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));

  //   res.status(200).json({
  //     message: "ok",
  //   });
});

export { registerUser };
