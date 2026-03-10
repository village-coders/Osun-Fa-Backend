import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ICoach extends Document {
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

    passportPhotographUrl?: string;
    ninDocumentUrl?: string;
    birthCertificateUrl?: string;
    proofOfAddressUrl?: string;

    highestCoachingQualification?: string;
    qualificationOther?: string;
    issuingBody?: string;
    issuingBodyOther?: string;
    certificateNumber?: string;
    yearObtained?: string;
    licenseExpiryDate?: string;
    certificateUploadUrl?: string;

    primaryCoachingRole?: string;
    roleOther?: string;
    specialization?: string;
    yearsOfExperience?: string;
    currentClub?: string;
    clubRegistrationNumber?: string;
    previousClubs?: string;

    recentCoursesAttended?: string;
    yearsAttended?: string;
    cpdCertificatesUploadUrl?: string;

    knownMedicalConditions?: string;
    medicalFitnessCertificateUrl?: string;

    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    paymentReference?: string;

    declarationAccepted?: boolean;
    coachFullName?: string;
    digitalSignature?: string;
    date?: Date;
    status: 'Pending' | 'Approved' | 'Rejected';
    remarks?: string;
    reviewedBy?: string;
}

const coachSchema = new Schema<ICoach>(
    {
        email: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true },
        role: { type: String, default: 'coach' },
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

        passportPhotographUrl: { type: String },
        ninDocumentUrl: { type: String },
        birthCertificateUrl: { type: String },
        proofOfAddressUrl: { type: String },

        highestCoachingQualification: { type: String },
        qualificationOther: { type: String },
        issuingBody: { type: String },
        issuingBodyOther: { type: String },
        certificateNumber: { type: String },
        yearObtained: { type: String },
        licenseExpiryDate: { type: String },
        certificateUploadUrl: { type: String },

        primaryCoachingRole: { type: String },
        roleOther: { type: String },
        specialization: { type: String },
        yearsOfExperience: { type: String },
        currentClub: { type: String },
        clubRegistrationNumber: { type: String },
        previousClubs: { type: String },

        recentCoursesAttended: { type: String },
        yearsAttended: { type: String },
        cpdCertificatesUploadUrl: { type: String },

        knownMedicalConditions: { type: String },
        medicalFitnessCertificateUrl: { type: String },

        bankName: { type: String },
        accountName: { type: String },
        accountNumber: { type: String },
        paymentReference: { type: String },

        declarationAccepted: { type: Boolean, default: false },
        coachFullName: { type: String },
        digitalSignature: { type: String },
        date: { type: Date },
        status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
        remarks: { type: String },
        reviewedBy: { type: String }
    },
    { timestamps: true }
);

coachSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.passwordHash);
};

export const Coach = mongoose.model<ICoach>('Coach', coachSchema);
