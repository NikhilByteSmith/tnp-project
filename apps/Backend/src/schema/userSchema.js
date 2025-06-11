import { Schema as _Schema, model } from "mongoose";
import jsonwebtoken from 'jsonwebtoken';
const { sign } = jsonwebtoken;
import bcrypt from 'bcrypt';
const Schema = _Schema;

const UserSchema = Schema({
    email: { type: String, required: [true, "Email is required"], unique: true, lowercase: true, trim: true },
    password: { type: String, required: [true, "Password is required"], select: false },
    isVerified: { type: Boolean, default: false },
    profileStatus: { type: String, enum: ['unlocked', 'locked'], default: 'unlocked'},
    unlockedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
    userRoleAsAdmin: { type: String, enum: ['owner', 'admin', 'pcc', 'superadmin', 'none'], required: false },
    user_role: { type: String, enum: ['admin', 'student', 'company'], required: [true, "User Role is required"] },
    Student: { type: Schema.Types.ObjectId, ref: "Student", required: false },
    Company: { type: Schema.Types.ObjectId, ref: "Company", required: false },
    lastLogin: { type: Date },
    authToken: { type: String, default: "" },
    refreshToken: { type: String, default: "" },
    avatar: { type: String, default: "" },
    verificationToken: { type: String, select: false },
    verificationTokenExpiry: { type: Date, select: false },
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        console.error("Error in pre-save hook:", error); // Log the error
        next(error);
    }
});

UserSchema.methods.comparePasswords = async function (userPassword) {
    return await bcrypt.compare(userPassword, this.password);
};

UserSchema.methods.generateAccessToken = function () {
    return sign(
        {
            _id: this._id,
            email: this.email,
            role: this.user_role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};

UserSchema.methods.generateRefreshToken = function () {
    return sign(
        {
            _id: this._id,
            email: this.email,
            role: this.user_role
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
};

const User = model("User", UserSchema);
export default User;