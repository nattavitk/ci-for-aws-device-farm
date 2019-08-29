from appium import webdriver
import unittest
import time

desired_cap = {
    "platformName": "Android",
    "deviceName": "aPhone",
}

driver = webdriver.Remote("http://127.0.0.1:4723/wd/hub", desired_cap)
driver.get("https://test.com")  # Add test url here


class TravelTest(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        driver.implicitly_wait(5)

    def test_A(self):
        self.driver = driver
        time.sleep(30)

    # ADD TEST SCRIPT HERE!!

    if __name__ == '__main__':
        unittest.main()

    def tearDown(self):
        """Shuts down the driver."""
        self.driver = driver
        self.driver.quit()
