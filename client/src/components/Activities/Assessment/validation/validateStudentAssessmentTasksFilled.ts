import { PyError, PyErrorDict } from "libs/PyError";
import {
    TAssessmentItemBase,
    TAssessmentTaskName,
    TTeacherAssessmentItems,
} from "models/Activity/Items/TAssessmentItems";
import { z, ZodEffects } from "zod";

type TValidateSchemas = {
    [key in TAssessmentTaskName]: z.ZodObject<any> | ZodEffects<any>;
};

const validateSchemas: TValidateSchemas = {
    [TAssessmentTaskName.TEXT]: z.object({}),
    [TAssessmentTaskName.TEST_SINGLE]: z.object({ answer: z.number({ invalid_type_error: "Ответ не выбран" }) }),
    [TAssessmentTaskName.TEST_MULTI]: z.object({ answers: z.number().array().nonempty("Ответы не выбраны") }),
    [TAssessmentTaskName.FIND_PAIR]: z
        .object({ first: z.string().array(), pars_created: z.number() })
        .refine(({ first, pars_created }) => first.length === pars_created, "Не все пары собраны"),
    [TAssessmentTaskName.CREATE_SENTENCE]: z.object({}),
    [TAssessmentTaskName.FILL_SPACES_EXISTS]: z.object({
        answers: z.string({ invalid_type_error: "Не все ответы заполнены" }).array(),
    }),
    [TAssessmentTaskName.FILL_SPACES_BY_HAND]: z.object({
        answers: z.string().min(1, "Не все ответы заполнены").array(),
    }),
    [TAssessmentTaskName.CLASSIFICATION]: z.object({
        inputs: z.string().array().length(0, "Не все ответы использованы"),
    }),
    [TAssessmentTaskName.SENTENCE_ORDER]: z.object({}),
    [TAssessmentTaskName.OPEN_QUESTION]: z.object({ answer: z.string().min(1, "Ответ не может быть пустым") }),
    [TAssessmentTaskName.IMG]: z.object({}),
    [TAssessmentTaskName.AUDIO]: z.object({}),
};

const validateTask = (task: TAssessmentItemBase): PyError | undefined => {
    try {
        validateSchemas[task.name].parse(task);
    } catch (error: any) {
        console.log(error.errors[0].message);
        return { message: error.errors[0].message, type: "value_error" };
    }
    return undefined;
};

export const validateStudentAssessmentTasksFilled = (
    tasks: TTeacherAssessmentItems | undefined,
): PyErrorDict | undefined => {
    if (tasks === undefined) {
        return undefined;
    }
    const errors: PyErrorDict = { errors: {}, message: "Не все задания были выполнены" };

    tasks.forEach((task, i) => {
        console.log(i, task.name);
        const validateResult = validateTask(task);
        if (validateResult === undefined) {
            return;
        }
        errors.errors[`${i}`] = validateResult;
    });

    if (Object.keys(errors.errors).length === 0) {
        return undefined;
    }

    return errors;
};
