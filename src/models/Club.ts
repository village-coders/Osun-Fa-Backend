import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IClub extends Document {
    email: string;
    passwordHash: string;
    role: string;
    isVerified: boolean;
    verificationToken?: string;
    comparePassword: (enteredPassword: string) => Promise<boolean>;

    name?: string;
    clubName?: string;
    slug?: string;
    shortName?: string;
    shortNameNickname?: string;
    yearOfEstablishment?: string;
    establishmentYear?: string;
    clubCategory?: string;
    leagueLevel?: string;
    leagueOther?: string;

    registeredAddress?: string;
    lga?: string;
    city?: string;
    townCity?: string;
    state?: string;
    officialPhoneNumber?: string;
    officialPhone?: string;
    officialEmailAddress?: string;
    officialEmail?: string;
    websiteSocialMedia?: string;

    chairmanName?: string;
    chairmanPhone?: string;
    chairmanEmail?: string;

    secretaryName?: string;
    secretaryPhone?: string;
    secretaryEmail?: string;

    headCoachName?: string;
    headCoachLicenseLevel?: string;
    headCoachPhone?: string;

    teamManagerName?: string;
    teamManagerPhone?: string;

    cacRegistrationCertificateUrl?: string;
    osfaAffiliationCertificateUrl?: string;
    constitutionUrl?: string;
    clubLogoUrl?: string;
    applicationLetterUrl?: string;

    homeGroundName?: string;
    stadiumAddress?: string;
    trainingGround?: string;
    homeKitColor?: string;
    awayKitColor?: string;
    reserveKitColor?: string;
    numberOfPlayers?: string;
    youthTeamsAvailable?: string[];

    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    paymentReference?: string;

    declarationAccepted?: boolean;
    authorizedOfficerName?: string;
    authorizedOfficerPosition?: string;
    digitalSignature?: string;
    date?: Date;
    dataProtectionConsent?: boolean;

    // Admin Fields
    applicationId?: string;
    dateSubmitted?: Date;
    reviewedBy?: string;
    remarks?: string;

    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: Date;
    updatedAt: Date;
}

const clubSchema = new Schema<IClub>(
    {
        email: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true },
        role: { type: String, default: 'team' },
        isVerified: { type: Boolean, default: false },
        verificationToken: { type: String },

        name: { type: String },
        clubName: { type: String }, // Legacy
        slug: { type: String, unique: true, sparse: true },
        shortName: { type: String },
        shortNameNickname: { type: String },
        yearOfEstablishment: { type: String },
        establishmentYear: { type: String },
        clubCategory: { type: String },
        leagueLevel: { type: String },
        leagueOther: { type: String },

        registeredAddress: { type: String },
        lga: { type: String },
        city: { type: String },
        townCity: { type: String }, // Legacy
        state: { type: String, default: 'Osun State' },
        officialPhoneNumber: { type: String },
        officialPhone: { type: String },
        officialEmailAddress: { type: String },
        officialEmail: { type: String },
        websiteSocialMedia: { type: String },

        chairmanName: { type: String },
        chairmanPhone: { type: String },
        chairmanEmail: { type: String },

        secretaryName: { type: String },
        secretaryPhone: { type: String },
        secretaryEmail: { type: String },

        headCoachName: { type: String },
        headCoachLicenseLevel: { type: String },
        headCoachPhone: { type: String },

        teamManagerName: { type: String },
        teamManagerPhone: { type: String },

        cacRegistrationCertificateUrl: { type: String },
        osfaAffiliationCertificateUrl: { type: String },
        constitutionUrl: { type: String },
        clubLogoUrl: { type: String },
        applicationLetterUrl: { type: String },

        homeGroundName: { type: String },
        stadiumAddress: { type: String },
        trainingGround: { type: String },
        homeKitColor: { type: String },
        awayKitColor: { type: String },
        reserveKitColor: { type: String },
        numberOfPlayers: { type: String },
        youthTeamsAvailable: [{ type: String }],

        bankName: { type: String },
        accountName: { type: String },
        accountNumber: { type: String },
        paymentReference: { type: String },

        declarationAccepted: { type: Boolean, default: false },
        authorizedOfficerName: { type: String },
        authorizedOfficerPosition: { type: String },
        digitalSignature: { type: String },
        date: { type: Date },
        dataProtectionConsent: { type: Boolean, default: false },

        // Admin Fields
        applicationId: { type: String },
        dateSubmitted: { type: Date },
        reviewedBy: { type: String },
        remarks: { type: String },

        status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
    },
    { timestamps: true }
);

clubSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.passwordHash);
};

export const Club = mongoose.model<IClub>('Club', clubSchema);
