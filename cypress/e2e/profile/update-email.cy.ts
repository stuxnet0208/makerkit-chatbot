import profilePo from '../../support/profile.po';
import organizationPageObject from '../../support/organization.po';

describe(`Update Email`, () => {
  const newEmailAddress = `new-email+${Math.round(Math.random() * 50)}@makerkit.dev`;

  describe(`When updating the user email`, () => {
    it('should successfully update the user email', () => {
      const organization = organizationPageObject.useDefaultOrganization();

      cy.signIn(`/dashboard/${organization}/settings/profile/email`);

      cy.intercept('PUT', '**auth/v1/user**').as('updateEmail');

      profilePo.$getNewEmailInput().clear().type(newEmailAddress);
      profilePo.$getRepeatEmailInput().clear().type(newEmailAddress);
      profilePo.$getUpdateEmailForm().submit();

      cy.wait('@updateEmail').its('response.statusCode').should('eq', 200);

      profilePo.$getUpdateEmailErrorAlert().should('not.exist');

      // should reset the form values
      profilePo.$getNewEmailInput().invoke('val').should('be.empty');
      profilePo.$getRepeatEmailInput().invoke('val').should('be.empty');
    });
  });
});
