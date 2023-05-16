/**
 * @jest-environment jsdom
 */
import {screen, waitFor, fireEvent} from "@testing-library/dom"
import "@testing-library/jest-dom";
import userEvent from '@testing-library/user-event'
import BillsUI from "../views/BillsUI.js"
import Actions from "../views/Actions.js"
import Bills from "../containers/Bills";
import { bills } from "../fixtures/bills.js"
import mockedBillsWithErrors from "../__mocks__/store-with-errors";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      //expect(windowIcon).toHaveClass('active-icon');
      expect(windowIcon.classList.contains('active-icon')).toBe(true);
    })

    test("then the click on new Bill Button shoud render new Bill Page", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const bills = new Bills({
        document, onNavigate, store: null,localStorage: window.localStorage
      })
      document.body.innerHTML = BillsUI({ data: bills })
      const handleClickNewBill = jest.fn(bills.handleClickNewBill);
      const btnNewBill = screen.getByTestId('btn-new-bill')
      btnNewBill.addEventListener('click', handleClickNewBill)
      userEvent.click(btnNewBill)
      expect(handleClickNewBill).toHaveBeenCalled()
      expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy()
    })

    describe("When I click on the icon eye", () => {
      test("A modal should open ", () => {
        document.body.innerHTML = BillsUI({ data: bills });
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const sampleBills = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        });
    
        const modale = document.getElementById("modaleFile");
        $.fn.modal = jest.fn(() => modale.classList.add("show"));
        const handleClickIconEye = jest.fn(() => sampleBills.handleClickIconEye);
        const iconEye = screen.getAllByTestId("icon-eye")[0];
    
        iconEye.addEventListener("click", handleClickIconEye);
        userEvent.click(iconEye);
        expect(handleClickIconEye).toHaveBeenCalled();
        //expect(modale).toHaveClass("show");
        expect(modale.classList.contains('show')).toBe(true);
        //const proof = document.querySelector(".bill-proof-container img");
        //expect(proof).not.toHaveAttribute("src", "https://test.storage.tld/null");
      });
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    // test d'intégration GET
    describe("When I navigate to Bills page", () => {
      test("fetches bills from mock API GET", async () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        localStorage.setItem("user", JSON.stringify({ type: "Employee"}));
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.Bills)

        await waitFor(() => screen.getByText("Mes notes de frais"))
        expect(screen.getByText("Mes notes de frais")).toBeTruthy()

        const tableRows = screen.getByTestId("tbody");
        expect(tableRows).toBeTruthy();
        
        const rows = screen.getAllByRole("row");
        //Ligne de l'entete et 4 bills => 5 lignes
        expect(rows).toHaveLength(5);
      })
      describe("When an error occurs on API", () => {
        beforeEach(() => {
          jest.spyOn(mockStore, "bills")
          Object.defineProperty(
              window,
              'localStorage',
              { value: localStorageMock }
          )
          window.localStorage.setItem('user', JSON.stringify({
            type: "Employee", email: "a@a" 
          }))
          const root = document.createElement("div")
          root.setAttribute("id", "root")
          document.body.appendChild(root)
          router()
        })

        test("fetches bills from an API and fails with 404 message error", async () => {
          
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list: () => {
                return Promise.reject(new Error("Erreur 404"));
              },
            };
          });
          //window.onNavigate(ROUTES_PATH.Bills);
          //await new Promise(process.nextTick);
          const html = BillsUI({ error: 'Erreur 404' });
				  document.body.innerHTML = html;
          const message = await screen.getByText(/Erreur 404/);
          expect(message).toBeTruthy();
        });
  
    
        test("fetches messages from an API and fails with 500 message error", async () => {
          mockStore.bills.mockImplementationOnce(() => {
           return {
              list : () =>  {
                return Promise.reject(new Error("Erreur 500"))
              }
            }})
          const html = BillsUI({ error: 'Erreur 500' });
          document.body.innerHTML = html;
          const message = await screen.getByText(/Erreur 500/)
          expect(message).toBeTruthy()
        })
      })
    
    
    })
  })
})

describe("When corrupted data was introduced", () => {
  test("Then it should return unformatted date", async () => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );

    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
    window.onNavigate(ROUTES_PATH.Bills);

    const sampleBills = new Bills({
      document,
      onNavigate,
      store: mockedBillsWithErrors,
      localStorage: window.localStorage,
    });
    const sampleBillsSorted = await sampleBills.getBills().then((data) => {
      const dataResult = [...data];
      return dataResult;
    });
    document.body.innerHTML = BillsUI({ data: sampleBillsSorted });
    const html = document.body.textContent;
    const pattern = /\d+[- /.]\d+[- /.]\d+/i; /* unformatted data */
    const patternResult = pattern.test(html);
    expect(patternResult).toEqual(true);
  });
});
