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
  mointoringScientist: Joi.string().required(),
  principalInvestigatorName: Joi.string().required(),
  userid: Joi.string().required(),
});
const validateFormData = (req, res, next) => {
  const { error } = formSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      message: "Validation Error",
      errors: error.details.map((err) => err.message),
    });
  }

  next();
};
module.exports = validateFormData;
