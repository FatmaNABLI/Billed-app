/**
 * @jest-environment jsdom
 */

import { fireEvent, screen} from "@testing-library/dom"
import userEvent from "@testing-library/user-event";
import user from '@testing-library/user-event';
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import router from "../app/Router.js";


  const onNavigate = (pathname) => {
    document.body.innerHTML = ROUTES({ pathname })
  }

  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem('user', JSON.stringify({
    type: 'Employee'
  }))


describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then new bill icon in vertical layout should be highlighted",  () => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      screen.getByTestId('icon-mail')
      const windowIcon = screen.getByTestId('icon-mail')
      expect(windowIcon.classList.contains('active-icon')).toBe(true);
    })
  })
  //Champs vides
  describe("when I am on Bill Page and I do not fill fields", () =>{
    test("Then the click on send button should render newBill page", () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      document.body.innerHTML = NewBillUI();
      window.onNavigate(ROUTES_PATH.NewBill);
  
      const newBill = new NewBill({
        document, onNavigate, store: mockStore,localStorage: window.localStorage
      })
      const formNewBill = screen.getByTestId('form-new-bill')
      const handleSubmit = jest.fn(newBill. handleSubmit);      
      formNewBill.addEventListener('submit', handleSubmit)
      fireEvent.submit(formNewBill);
      expect(formNewBill).toBeTruthy();

    })
  })
  //Test du chargement du fichier
  describe("when I am on Bill Page and I choose a bad format of file",() => {
    test("Then the file should not be uploaded", () =>{
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      document.body.innerHTML = NewBillUI();
      window.onNavigate(ROUTES_PATH.NewBill);
  
      const newBill = new NewBill({
        document, onNavigate, store: mockStore,localStorage: window.localStorage
      })

      const handleChangeFile = jest.spyOn(newBill, "handleChangeFile");
      const input = screen.getByTestId("file");
      input.addEventListener("change", handleChangeFile);
      const file = new File(["img"], "nom.jpg", {
        type: "image/jpg",
      });
      const textFile = new File([""], "filename.txt", { type: 'text/html' });
      fireEvent.change(input, {target : {files:[textFile]}})
      //user.upload(input, file);
      expect(handleChangeFile).toHaveBeenCalled();
      expect(input.classList.contains('erreur')).toBe(true);
    })
  })
  

  //Champs remplis au bon format
  describe("When I am on NewBill Page and I do fill fields in correct format", () => {
    test("Then the click on send button should render Bills page", () => {
      
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      document.body.innerHTML = NewBillUI();
      window.onNavigate(ROUTES_PATH.NewBill);
  
      const newBill = new NewBill({
        document, onNavigate, store: mockStore,localStorage: window.localStorage
      })

      const inputData = bills[0];
      const formNewBill = screen.getByTestId('form-new-bill')
      //Récupérer les différents champs de l'interface

      const expenseType = screen.getByTestId("expense-type");
      const expenseName = screen.getByTestId("expense-name");
      const amount = screen.getByTestId("amount");
      const date = screen.getByTestId("datepicker");
      const vat = screen.getByTestId("vat");
      const pct = screen.getByTestId("pct");
      const commentary = screen.getByTestId("commentary");
      const input = screen.getByTestId("file");
      const file = new File(["img"], inputData.fileName, {
        type: "image/jpg",
      });


      //Remplir les champs à partir d'inputData et s'assurer de leur validité
      userEvent.selectOptions(expenseType,  screen.getByRole('option', {name: inputData.type}));
      expect(screen.getByRole('option', {name: inputData.type}).selected).toBe(true)

      fireEvent.change(expenseName, { target: { value: inputData.name } });
      expect(expenseName.value).toBe(inputData.name);

      fireEvent.change(amount, { target: { value: inputData.amount } });
      expect(amount.value).toBe(inputData.amount.toString());

      fireEvent.change(date, { target: { value: inputData.date } });
      expect(date.value).toBe(inputData.date);
      
      fireEvent.change(vat, { target: { value: inputData.vat } });
      expect(vat.value).toBe(inputData.vat);

      fireEvent.change(pct, { target: { value: inputData.pct } });
      expect(pct.value).toBe(inputData.pct.toString());

      fireEvent.change(commentary, { target: { value: inputData.commentary } });
      expect(commentary.value).toBe(inputData.commentary);

      user.upload(input, file);
      
      //Soumettre le formulaire
      const handleSubmit = jest.fn(newBill. handleSubmit);      
      formNewBill.addEventListener('submit', handleSubmit)
      fireEvent.submit(formNewBill);
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    })
  })


})
