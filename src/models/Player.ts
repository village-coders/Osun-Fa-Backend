import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer extends Document {
    surname: string;
    firstName: string;
    otherNames?: string;
    gender: string;
    dateOfBirth: string;
    placeOfBirth: string;
    nationality: string;
    stateOfOrigin: string;
    lga: string;
    residentialAddress: string;

    phoneNumber: string;
    emailAddress?: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    relationshipToPlayer: string;

    parentFullName?: string;
    parentPhoneNumber?: string;
    parentAddress?: string;
    consentFormUploadUrl?: string;

    passportPhotographUrl?: string;
    birthCertificateUrl?: string;
    ninDocumentUrl?: string;
    schoolIdUrl?: string;

    currentClubName?: string;
    clubRegistrationNumber?: string;
    playingPosition: string;
    preferredPosition?: string;
    jerseyNumber?: string;
    dominantFoot: string;
    heightCm?: string;
    weightKg?: string;
    yearsOfExperience: string;

    previouslyRegisteredWithOSFA: string;
    previousOsfaClub?: string;
    previousClubs?: string;
    outstandingTransferIssues: string;
    transferIssueDetails?: string;

    bloodGroup?: string;
    knownMedicalConditions?: string;
    allergies?: string;
    medicalClearanceUploadUrl?: string;

    highestEducationLevel?: string;
    schoolInstitutionEmployer?: string;

    declarationAccepted: boolean;
    playerName: string;
    digitalSignature: string;
    date: Date;
    parentName?: string;
    parentSignature?: string;

    status: 'Pending' | 'Approved' | 'Rejected' | 'Verified';
    registrationSeason?: string;
    dataProtectionConsent?: boolean;
    transferStatus: 'None' | 'OnMarket' | 'Released';
    marketValue?: number;
    clubId?: mongoose.Types.ObjectId;
    faceDescriptor?: number[];
    remarks?: string;
    reviewedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

const playerSchema = new Schema<IPlayer>(
    {
        surname: { type: String, required: true },
        firstName: { type: String, required: true },
        otherNames: { type: String },
        gender: { type: String, required: true },
        dateOfBirth: { type: String, required: true },
        placeOfBirth: { type: String, required: true },
        nationality: { type: String, required: true },
        stateOfOrigin: { type: String, required: true },
        lga: { type: String, required: true },
        residentialAddress: { type: String, required: true },

        phoneNumber: { type: String, required: true },
        emailAddress: { type: String },
        emergencyContactName: { type: String, required: true },
        emergencyContactPhone: { type: String, required: true },
        relationshipToPlayer: { type: String, required: true },

        parentFullName: { type: String },
        parentPhoneNumber: { type: String },
        parentAddress: { type: String },
        consentFormUploadUrl: { type: String },

        passportPhotographUrl: { type: String },
        birthCertificateUrl: { type: String },
        ninDocumentUrl: { type: String },
        schoolIdUrl: { type: String },

        currentClubName: { type: String },
        clubRegistrationNumber: { type: String },
        playingPosition: { type: String, required: true },
        preferredPosition: { type: String },
        jerseyNumber: { type: String },
        dominantFoot: { type: String, required: true },
        heightCm: { type: String },
        weightKg: { type: String },
        yearsOfExperience: { type: String, required: true },

        previouslyRegisteredWithOSFA: { type: String, required: true },
        previousOsfaClub: { type: String },
        previousClubs: { type: String },
        outstandingTransferIssues: { type: String, required: true },
        transferIssueDetails: { type: String },

        bloodGroup: { type: String },
        knownMedicalConditions: { type: String },
        allergies: { type: String },
        medicalClearanceUploadUrl: { type: String },

        highestEducationLevel: { type: String },
        schoolInstitutionEmployer: { type: String },

        declarationAccepted: { type: Boolean, required: true },
        playerName: { type: String, required: true },
        digitalSignature: { type: String, required: true },
        date: { type: Date, required: true },
        parentName: { type: String },
        parentSignature: { type: String },

        status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Verified'], default: 'Pending' },
        registrationSeason: { type: String },
        dataProtectionConsent: { type: Boolean, default: false },
        transferStatus: { type: String, enum: ['None', 'OnMarket', 'Released'], default: 'None' },
        marketValue: { type: Number, default: 0 },
        clubId: { type: Schema.Types.ObjectId, ref: 'Club' },
        faceDescriptor: { type: [Number] },
        remarks: { type: String },
        reviewedBy: { type: String }
    },
    { timestamps: true }
);

export const Player = mongoose.model<IPlayer>('Player', playerSchema);
