#include <unistd.h>
#include <iostream>
using namespace std;

int main()
{
    if (access("node_modules", F_OK) != 0)
    {
        string choice;
        cout << "Requirement Not Found!" << endl;
        cout << "Make sure you`re installed node.js and npm!" << endl;
        cout << "Do you want to install requirement?(Y/n)" << endl;
        cin >> choice;
        if (choice == "n")
        {
            exit(1);
        }
        else
        {
            cout << "Installing..." << endl;
            system("npm i");
        };
    }
    else
    {
        cout << "Requirement Found!" << endl;
        cout << "Starting TMBot..." << endl;
        system("node app.js");
    }

    return 0;
}