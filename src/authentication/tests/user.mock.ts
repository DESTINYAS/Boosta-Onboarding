import User from "../../users/entities/user.entity";
import BoostaRoles from '../../roles/roles.enum';
import Gender from "../../users/entities/gender.enum";
import Profile from "../../users/entities/profile.entity";

export const MOCKED_USER_PASSWORD = "strongUserPASSWORD"
export const MOCKED_ADMIN_USER_PASSWORD = "strongAdminPASSWORD"
export const MOCKED_PASSWORD = "strongAdminPASSWORD"

// userID: 3
export const MOCKED_AGENT_BEARER = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzIiwiaWF0IjoxNjU5MTc0MzQ0LCJleHAiOjE2NTkxNzc5NDR9.5IgY8asap6I7GBy6E_SkA5ig3Vnk58qPPam6dn9s3K0"

// userID: 2
export const MOCKED_MERCHANT_BEARER = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyIiwiaWF0IjoxNjU5MTc0MzQ0LCJleHAiOjE2NTkxNzc5NDR9.bUiuRZ-07jusqyONZ9B_zGbAxV-bFVzeOqe5J0HH6zM"

// userID: 1
export const MOCKED_ADMIN_BEARER = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwiaWF0IjoxNjU5MTc0MzQ0LCJleHAiOjE2NTkxNzc5NDR9.qnKc3TqluR27VE0VmViT6XCb5xxD6GU6py8ASGxuWEs"

export const mockProfile: Profile = {
    id: "1",
    homeAddress: "",
    isOnboarded: false,
    isPhoneVerified: false
}

const mockedMerchantUser: User = {
    id: "2",
    userID: "2",
    phoneNumber: '08008293921',
    firstName: 'John',
    lastName: 'John',
    middleName: 'John',
    token: "token",
    hashedPurchasePin:"1234",
    email:"boosta@gmail.com",
    isSuperUser: false,
    isActive: true,
    gender: Gender.Male,
    // hashedPassword: '$2b$10$yDKeHUhKwm3QjmdcB3KmGeX40/poZ2G5ksITtY1bKFIAkc2D9QbuG', //MOCKED_USER_PASSWORD
    role: BoostaRoles.Merchant,
    profile: {
        id: "1",
        homeAddress: "",
        isOnboarded: false,
        isPhoneVerified: false
    },
    createdBy: new User,
    createdAt: new Date(),
    updatedAt: new Date()
}

export const mockedAdminUser: User = {
    id: "1",
    userID: "1",
    phoneNumber: '08008293922',
    firstName: 'Admin Felix',
    lastName: 'Akpan',
    middleName: 'F',
    token: "token",
    hashedPurchasePin:"1234",
    email:"boosta@gmail.com",
    isSuperUser: true,
    isActive: true,
    gender: Gender.Male,
    // hashedPassword: '$2b$10$tYhyQO945w1V3EmcO5yo1el2oOdmNrBJVzYXHwoofEfYZsaOgzx1W', //MOCKED_ADMIN_USER_PASSWORD
    role: BoostaRoles.Admin,
    profile: {
        id: "1",
        homeAddress: "",
        isOnboarded: true,
        isPhoneVerified: true
    },
    createdBy: new User,
    createdAt: new Date(),
    updatedAt: new Date()
}

export const mockedAgentUser: User = {
    id: "3",
    userID: "3",
    phoneNumber: '08008293922',
    firstName: 'Agent Felix',
    lastName: 'Akpan',
    middleName: 'F',
    token: "token",
    hashedPurchasePin:"1234",
    email:"boosta@gmail.com",
    isSuperUser: false,
    isActive: true,
    gender: Gender.Male,
    // hashedPassword: '$2b$10$tYhyQO945w1V3EmcO5yo1el2oOdmNrBJVzYXHwoofEfYZsaOgzx1W',
    role: BoostaRoles.Agent,
    profile: {
        id: "1",
        homeAddress: "",
        isOnboarded: false,
        isPhoneVerified: false
    },
    createdBy: new User,
    createdAt: new Date(),
    updatedAt: new Date()
}


export default mockedMerchantUser