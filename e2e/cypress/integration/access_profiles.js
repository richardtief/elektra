describe("Access profiles", () => {
  beforeEach(() => {
    cy.elektraLogin(
      Cypress.env("TEST_DOMAIN"),
      Cypress.env("TEST_USER"),
      Cypress.env("TEST_PASSWORD")
    )
    cy.visit(
      `/${Cypress.env(
        "TEST_DOMAIN"
      )}/member/home?overlay=/monsoon3/cc-demo/access-profile/`
    )
  })

  it("The access profile page is reachable", () => {
    cy.get(".service")
    cy.contains("Internet")
    cy.request(
      `/${Cypress.env(
        "TEST_DOMAIN"
      )}/member/home?overlay=/monsoon3/cc-demo/access-profile/`
    ).should((response) => {
      expect(response.status).to.eq(200)
    })
    cy.get(".btn").contains("New")
  })

  // it("click on 'Create New' button opens a modal window", () => {
  //   cy.get(".btn").contains("Create New").click()
  //   cy.url().should("include", "instances?overlay=new")
  //   cy.get("button.btn.btn-primary").contains("Create")
  // })
})
