import z from 'zod'


export const locationSchema =z.object({
    latitude: z.number(),
    longitude: z.number()
})

// Example: Weaving Unit




export const unitType=z.enum( [
    "YARN_SPINNING",
    "YARN_PROCESSING",
    "WEAVING_UNIT",
    "KNITTING_UNIT",
    "DYEING_UNIT",
    "FABRIC_PROCESSING_UNIT",
    "FABRIC_FINISHING_UNIT",
    "WASHING_UNIT",
    "CUTTING_UNIT",
    "COMPUTERIZED_EMBROIDERY_UNIT",
    "MANUAL_EMBROIDERY_UNIT",
    "FUSING_UNIT",
    "PRINTING_UNIT",
    "STITCHING_UNIT",
    "CHECKING_UNIT",
    "IRONING_PACKING_UNIT",
    "KAJA_BUTTON_UNIT",
    "MULTI_NEEDLE_DOUBLE_CHAIN_UNIT",
    "OIL_REMOVING_MENDING_CENTER",
    "PATTERN_MAKING_CENTER",
    "FILM_SCREEN_MAKING_CENTER",
])

export const certifications=z.enum([
    "Import Export Certificate",
    "ISO 9001",
    "GOTS",
    "Fair Trade",
    "OEKO-TEX",
    "SA8000",
    "RCS",
    "BCI Cotton",
    "Sedex",
    "OCS",
    "GRS",
])


const KnittingMachineSchema = z.object({
    diameter: z.union([
        z.enum([
            "6", "7", "8", "9", "10", "11", "12", "13", "14", "15",
            "16", "17", "18", "19", "20", "21" ,"22","23" ,"24","25","26","27","28","29","30", "32","34","36","38","40","42","44"
        ]).transform(Number), // stored as number
        z.number()
    ]),

    gauge: z.array(
        z.union([
            z.enum([
                "5", "7", "9", "12", "14", "16", "18", "20", "24", "28",
                "30", "32", "34", "36", "40", "44", "48", "52", "56", "60"
            ]).transform(Number), // string enum → number
            z.number() // also allow plain number
        ])
    ),
    machineType: z.enum([
        "Single Jersey",
        "Double Jersey - Rib",
        "Double Jersey - Interlock",
        "3 Thread Fleece",
        "Wrapper",
        "Terry",
        "Seamless",
        "Garment Length",
    ]),
    specialFeatures: z.array(  z.enum([
        "Single Feeder",
        "Auto-striper",
        "Full Jacquard",
        "Mini Jacquard",
        "Wrapper",
        "Pointel Mini Jacquard",
        "Pointel Jacquard",
        "Denim Knit",
        "Double Side Terry",
        "Matress",
        "Polar Fleece",
        "Poly Fleece",
        "Quilt Design",
        "Spacer",
        "Sweater",
    ])).optional(),
    machineCylinderTrack:z.union([
        z.enum(["1", "2", "3", "4", "5", "6", "7"]).transform(Number),
        z.number()
    ]),
    takedownRollerType:z.enum(["Tubular", "open width"]),
    typeOfYarn: z.array( z.enum([
        "cotton",
        "viscose/Spun",
        "polyester/filament",
    ])),
    machineBrand:z.enum([
        "Mayer & Cie",
        "Unitex",
        "Year China",
        "Terrot",
        "Lakshmi Terrot",
        "CMS",
        "Falmac",
        "FUKURAHA",
        "FUKUHAMA",
        "Buiyuan",
        "Liski",
        "Pailung",
        "Santoni",
        "Smart",
        "Vilike",
        "Other",
    ]),
    "noOfMachines": z.number().int().positive(),

})
export const DyeingMachineSchema = z.discriminatedUnion("DyeingMachineType", [
    z.object({
        DyeingMachineType: z.literal("Jigger"),
        minimumCapacity: z.number().optional(),
        maximumCapacity: z.number().optional(),
        typeOfFabric: z.enum(["Tubular", "open width"]).optional(), // optional only for Jigger
        Maker: z.string().optional(),
        noOfMachines: z.number().int().positive(),
    }),
    z.object({
        DyeingMachineType: z.enum([
            "Soft FLow",
            "Jet",
            "Winch",
            "Beam",
            "Air Flow",
            "Pad Stream",
        ]),
        minimumCapacity: z.number().optional(),
        maximumCapacity: z.number().optional(),
        typeOfFabric: z.enum(["Tubular", "open width"]), // required for all others
        Maker: z.string().optional(),
        noOfMachines: z.number().int().positive(),
    }),
]);

export const WeavingMachineSchema = z.object({
    machineType: z.enum(["Hand Loom","Rapier Loom","Air Jet Loom", "Hand Loom - Jacquard", "Automatic Jacquard" ,"Projectile Loom", "Water Jet Loom", "Other"]),
    typeOfYarn: z.enum(["Cotton", "Viscose/Spun", "Polyester/Filament"]),
    noOfMachines: z.number().int().positive(),
});
export const YarnSpinningMachineSchema = z.object({
    machineType: z.enum(["Yarn Dyeing", "Cone-Winging", "Yarn Twisting"]),
    typeOfYarn: z.enum(["Cotton", "Viscose/Spun", "Polyester/Filament"]),
    noOfMachines: z.number().int().positive(),
})
export const YarnProcessingMachineSchema = z.object({
    typeOfYarnProcessingMachine: z.enum(["Yarn Dyeing", "Yarn Twisting", "Cone-Winding"]),
    noOfHeads: z.number().int().positive(),
    typeOfYarn: z.enum(["Cotton", "Viscose/Spun", "Polyester/Filament"]),
    noOfMachines: z.number().int().positive(),
})

export const FabricProcessingMachineSchema = z.object({
machineType:  z.enum(["Stenter", "Dryer", "Heat-setting" ,"Fabric Slitting","Napping or Raising","Raising" ,
"Padding","Mercerizing - Knit","Peaching","Sueding","Embossing","Calendring","Mercherizing - Woven"]),
    typeOfFabric: z.enum(["Tubular", "open width"]),
    maxWidthOfFabric: z.number().int().positive(),
    machineBrand: z.string(),
    noOfMachines: z.number().int().positive(),

})
export const FabricFinishingMachineSchema = z.object({
    machineType: z.enum(["Compacting", "Steaming", "Calendring"]),
    typeOfFabric: z.enum(["Tubular", "open width"]),
    maxWidthOfFabric: z.number().int().positive(),
    machineBrand: z.string(),
    noOfMachines: z.number().int().positive(),
})
export const WashingMachineSchema = z.object({
    machineType: z.enum(["Washing Machine", "Tumble Dryer", "Hydro Machine"]),
    noOfMachines: z.number().int().positive(),
})
export const CuttingMachineSchema=z.object({
    machineType: z.enum(["Hand Cutting", "Straight Knife", "Band Knife","Automatic Cutting"]),
    noOfMachines: z.number().int().positive().default(1),
})

export const ComputerizedEmbroiderySchema = z.object({
    machineType: z.enum(["Chenley", "With Sequence", "Without Sequence","Tufft","Schiffli M/c"]),
    noOfHeads: z.number().int().positive(),
    machineBrand: z.string(),
    model: z.string().optional(),
    noOfMachines: z.number().int().positive(),

})
export const ManualEmbedingMachineSchema = z.object({
    machineType: z.enum(["Chenley", "With Sequence", "Without Sequence","Tufft","Schiffli M/c"]),
    noOfHeads: z.number().int().positive(),
    machineBrand: z.string(),
    model: z.string().optional(),
    noOfMachines: z.number().int().positive(),

})
export const FusingMachineschema=z.object({
    machineType: z.enum(["Roller", "Curing Machine", "Single Flat bed","Double Flat Bed",
    "Four Side Flat Bed"]),
    bedSizeLength:z.number().int().positive().optional(),
    bedSizeBreath:z.number().int().positive().optional(),
    noOfMachines: z.number().int().positive().optional(),
})
export const PrintingMachineSchema=z.object({
    PrintingMachineType: z.enum(["Wooden Table", "Manual M/c", "Automatic M/c","Glass Table" ,
    "Rotary M/c","Sublimation Print","Heat Transfers","Emboss Print","Digital Sticker Print (DTF)","Digital Print (DTG)","Burnout"]),
    PalletSize:z.number().int().positive()
})
const StitchingMachineSchema=z.object({
    machineType: z.enum(["Single Needle (singer)", "Double Needle", "Overlock","Flatlock",
        "Feed of the arm","Edge Cutter","Chain Stitch","Others"]),
    noOfMachines: z.number().int().positive().optional(),

})
const CheckingMachineSchema=z.object({

})
const IronPackageMachineSchema=z.object({

})
const KajaButtonMachineSchema=z.object({

})
const MultiNeedleDoubleChainMachineSchema=z.object({})

const OilRemovingMendingCenterSchema=z.object({})
const PatternMakingCenterSchema=z.object({})
const FilmScreenMakingCenterSchema=z.object({})
export const UnitSchemas: Record<string, z.ZodTypeAny> = {
    YARN_SPINNING:YarnSpinningMachineSchema,
    YARN_PROCESSING:YarnProcessingMachineSchema,
    WEAVING_UNIT: WeavingMachineSchema,
    KNITTING_UNIT: KnittingMachineSchema,
    DYEING_UNIT: DyeingMachineSchema,
    FABRIC_PROCESSING_UNIT:FabricProcessingMachineSchema,
    FABRIC_FINISHING_UNIT:FabricFinishingMachineSchema,
    WASHING_UNIT:WashingMachineSchema,
    CUTTING_UNIT:CuttingMachineSchema,
    COMPUTERIZED_EMBROIDERY_UNIT:ComputerizedEmbroiderySchema,
    MANUAL_EMBROIDERY_UNIT:ManualEmbedingMachineSchema,
    FUSING_UNIT:FusingMachineschema,
    PRINTING_UNIT:PrintingMachineSchema,
    STITCHING_UNIT:StitchingMachineSchema,
    CHECKING_UNIT:CheckingMachineSchema,
    IRONING_PACKING_UNIT:IronPackageMachineSchema,
    KAJA_BUTTON_UNIT:KajaButtonMachineSchema,
    MULTI_NEEDLE_DOUBLE_CHAIN_UNIT:MultiNeedleDoubleChainMachineSchema,
    OIL_REMOVING_MENDING_CENTER:OilRemovingMendingCenterSchema,
    PATTERN_MAKING_CENTER:PatternMakingCenterSchema,
    FILM_SCREEN_MAKING_CENTER:FilmScreenMakingCenterSchema






    // Add more dynamically later
};
export const WorkTypeSchema = z.enum(["DOMESTIC_WORK", "EXPORT_WORK"]);

export const onBoardCompany=z.object({
    name: z.string().min(1, "Name is required"),
    contactNumber: z.string().min(1, "Contact Number is required"),
    gstNumber: z.string().optional(),
    aboutCompany: z.string().optional(),
    workType: WorkTypeSchema,
    unitType:unitType,
    location:locationSchema,
    unitSqFeet: z.number().int().positive(),
    companyLogo: z.url().optional(),
    unitImages: z.array(z.url()).optional(),
    machinery: z.array(z.any()).optional(),
    service: z.array(z.object({
        title : z.string().optional(),
        description : z.string().optional(),
    })).optional(),
    certifications: z.array(certifications).optional(),

}).superRefine((data, ctx) => {
    const schema = UnitSchemas[data.unitType];
    if (!schema) return;


    if (data.machinery && data.machinery.length > 0) {
        data.machinery.forEach((m, idx) => {
            const result = schema.safeParse(m);
            if (!result.success) {
                ctx.addIssue({
                    path: ["machinery", idx],
                    code: "custom",
                    message: `Invalid machinery for ${data.unitType}: ${JSON.stringify(
                        z.treeifyError(result.error)
                    )}`,
                });
            }
        });
    }
});