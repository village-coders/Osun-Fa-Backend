import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IReferee extends Document {
    email: string;
    passwordHash: string;
    role: string;
    isVerified: boolean;
    verificationToken?: string;
    comparePassword: (enteredPassword: string) => Promise<boolean>;

    surname?: string;
    firstName?: string;
    otherNames?: string;
    gender?: string;
    dateOfBirth?: string;
    placeOfBirth?: string;
    nationality?: string;
    stateOfOrigin?: string;
    lga?: string;
    residentialAddress?: string;

    phoneNumber?: string;
    alternativePhone?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    relationshipToEmergencyContact?: string;

    passportPhotographUrl?: string;
    ninDocumentUrl?: string;
    birthCertificateUrl?: string;
    medicalFitnessCertificateUrl?: string;

    refereeCategory?: string;
    currentGrade?: string;
    certificationBody?: string;
    certificateNumber?: string;
    yearCertified?: string;
    licenseExpiryDate?: string;
    certificationUploadUrl?: string;

    yearsOfExperience?: string;
    highestCompetitionOfficiated?: string;
    totalMatchesOfficiated?: string;
    recentMajorMatches?: string;

    lastFitnessTestDate?: string;
    fitnessTestResult?: string;
    lastAssessmentDate?: string;
    assessmentRating?: string;

    underSuspension?: string;
    suspensionDetails?: string;
    previousDisciplinaryAction?: string;
    disciplinaryDetails?: string;

    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    paymentReference?: string;

    declarationAccepted?: boolean;
    refereeFullName?: string;
    digitalSignature?: string;
    date?: Date;

    status: 'Pending' | 'Approved' | 'Rejected';
    remarks?: string;
    reviewedBy?: string;
}

const refereeSchema = new Schema<IReferee>(
    {
        email: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true },
        role: { type: String, default: 'referee' },
        isVerified: { type: Boolean, default: false },
        verificationToken: { type: String },

        surname: { type: String },
        firstName: { type: String },
        otherNames: { type: String },
        gender: { type: String },
        dateOfBirth: { type: String },
        placeOfBirth: { type: String },
        nationality: { type: String },
        stateOfOrigin: { type: String },
        lga: { type: String },
        residentialAddress: { type: String },

        phoneNumber: { type: String },
        alternativePhone: { type: String },
        emergencyContactName: { type: String },
        emergencyContactPhone: { type: String },
        relationshipToEmergencyContact: { type: String },

        passportPhotographUrl: { type: String },
        ninDocumentUrl: { type: String },
        birthCertificateUrl: { type: String },
        medicalFitnessCertificateUrl: { type: String },

        refereeCategory: { type: String },
        currentGrade: { type: String },
        certificationBody: { type: String },
        certificateNumber: { type: String },
        yearCertified: { type: String },
        licenseExpiryDate: { type: String },
        certificationUploadUrl: { type: String },

        yearsOfExperience: { type: String },
        highestCompetitionOfficiated: { type: String },
        totalMatchesOfficiated: { type: String },
        recentMajorMatches: { type: String },

        lastFitnessTestDate: { type: String },
        fitnessTestResult: { type: String },
        lastAssessmentDate: { type: String },
        assessmentRating: { type: String },

        underSuspension: { type: String },
        suspensionDetails: { type: String },
        previousDisciplinaryAction: { type: String },
        disciplinaryDetails: { type: String },

        bankName: { type: String },
        accountName: { type: String },
        accountNumber: { type: String },
        paymentReference: { type: String },

        declarationAccepted: { type: Boolean, default: false },
        refereeFullName: { type: String },
        digitalSignature: { type: String },
        date: { type: Date },

        status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
        remarks: { type: String },
        reviewedBy: { type: String }
    },
    { timestamps: true }
);

refereeSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.passwordHash);
};

export const Referee = mongoose.model<IReferee>('Referee', refereeSchema);
