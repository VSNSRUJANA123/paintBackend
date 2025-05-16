const Joi = require("joi");

const formSchema = Joi.object({
  studyNo: Joi.string().required(),
  studyphaseno: Joi.string().required(),
  compliance: Joi.string().required(),
  studyDirectorName: Joi.string().required(),
  studyShortTitleId: Joi.string().required(),
  testItemCategoryId: Joi.string().required(),
  testItemNameCode: Joi.string().required(),
  sponserIdCode: Joi.string().required(),
  studyAllocateDate: Joi.date().required(),
  testguidelines: Joi.string().required(),
  testitemothercategory: Joi.string().required(),
  remarks: Joi.string().optional().allow(""),
  mointoringScientist: Joi.string().required(),
  principalInvestigatorName: Joi.string().required(),
  userid: Joi.string().required(),
  // isCreated: Joi.date().required().default(new Date()),
  isActive: Joi.boolean().required(),
});
const validateFormData = (req, res, next) => {
  const { error } = formSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const fieldNames = error.details.map((err) => err.context.key);
    return res.status(400).json({ errors: fieldNames });
  }

  next();
};
module.exports = validateFormData;
