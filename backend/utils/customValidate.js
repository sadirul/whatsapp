import Validator from 'validatorjs';

const customValidate = (data, rules) => {
  const validation = new Validator(data, rules);

  if (validation.fails()) {
    const firstErrorField = Object.keys(validation.errors.errors)[0];
    const firstErrorMsg = validation.errors.errors[firstErrorField][0];

    return {
      status: false,
      message: firstErrorMsg,
    };
  }

  return { status: true };
};

export default customValidate;
